import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { google } from 'googleapis';

const {
  PORT = 4000,
  BASE_URL = `http://localhost:${PORT}`,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  SESSION_SECRET = 'dev_secret',
  FRONTEND_URL = 'http://localhost:3000',
  COOKIE_SECURE = 'false'
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('Missing Google OAuth envs: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
  process.exit(1);
}
if (!process.env.OPENROUTER_API_KEY) {
  console.warn('Warning: OPENROUTER_API_KEY is not set; /api/llm/chat will 500.');
}

const app = express();
app.set('trust proxy', 1);

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'lax',
    secure: COOKIE_SECURE === 'true'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

passport.use(new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${BASE_URL}/auth/google/callback`
  },
  (accessToken, refreshToken, profile, done) => {
    const user = { profile, tokens: { accessToken, refreshToken } };
    return done(null, user);
  }
));

app.get('/auth/google',
  passport.authenticate('google', { scope: SCOPES, accessType: 'offline', prompt: 'consent' })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/fail' }),
  (req, res) => res.redirect(FRONTEND_URL)
);

app.get('/auth/fail', (_, res) => res.status(401).json({ ok: false, error: 'Auth failed' }));
app.post('/auth/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(() => res.json({ ok: true }));
  });
});

app.get('/api/session', (req, res) => {
  res.json({ authenticated: !!req.user, user: req.user?.profile || null });
});

function ensureAuth(req, res, next) {
  if (!req.user?.tokens?.refreshToken) return res.status(401).json({ ok: false, error: 'Not authenticated' });
  return next();
}

function driveClient(req) {
  const oAuth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, `${BASE_URL}/auth/google/callback`);
  oAuth2Client.setCredentials({ refresh_token: req.user.tokens.refreshToken });
  return google.drive({ version: 'v3', auth: oAuth2Client });
}

// LLM proxy (OpenRouter)
app.post('/api/llm/chat', ensureAuth, async (req, res) => {
  try {
    const { params } = req.body || {};
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return res.status(500).json({ ok: false, error: 'Server missing OPENROUTER_API_KEY' });
    if (!params?.messages) return res.status(400).json({ ok: false, error: 'messages required' });

    const body = {
      model: params.model || 'openai/gpt-4o-mini',
      ...params,
    };

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'X-Title': 'KnowledgeGraph GPT'
      },
      body: JSON.stringify(body)
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ ok: false, error: data?.error || 'OpenRouter error' });

    const text = data?.choices?.[0]?.message?.content || '';
    res.json({ ok: true, text, raw: data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Drive JSON files (save/open/undo/save-as)
app.get('/api/documents', ensureAuth, async (req, res) => {
  try {
    const drive = driveClient(req);
    const q = "mimeType='application/json' and trashed=false";
    const { data } = await drive.files.list({
      q,
      fields: 'files(id, name, modifiedTime, size)',
      orderBy: 'modifiedTime desc',
      pageSize: 50
    });
    res.json({ ok: true, files: data.files || [] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/documents', ensureAuth, async (req, res) => {
  try {
    const { name = `kg-${Date.now()}.json`, content = {} } = req.body || {};
    const drive = driveClient(req);
    const fileMetadata = { name, mimeType: 'application/json' };
    const media = { mimeType: 'application/json', body: JSON.stringify(content) };
    const { data: file } = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, modifiedTime'
    });
    res.json({ ok: true, file });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/documents/:id', ensureAuth, async (req, res) => {
  try {
    const drive = driveClient(req);
    const { id } = req.params;
    const meta = await drive.files.get({ fileId: id, fields: 'id, name, modifiedTime' });
    const contentResp = await drive.files.get({ fileId: id, alt: 'media' }, { responseType: 'stream' });
    let data = '';
    contentResp.data.on('data', chunk => (data += chunk));
    contentResp.data.on('end', () => {
      res.json({ ok: true, file: meta.data, content: JSON.parse(data || '{}') });
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.put('/api/documents/:id', ensureAuth, async (req, res) => {
  try {
    const drive = driveClient(req);
    const { id } = req.params;
    const { content = {} } = req.body || {};
    const media = { mimeType: 'application/json', body: JSON.stringify(content) };
    const { data: file } = await drive.files.update({
      fileId: id,
      media,
      fields: 'id, name, modifiedTime'
    });
    res.json({ ok: true, file });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/documents/:id/save-as', ensureAuth, async (req, res) => {
  try {
    const drive = driveClient(req);
    const { id } = req.params;
    const { name } = req.body || {};
    const { data: file } = await drive.files.copy({
      fileId: id,
      requestBody: { name: name || `copy-${Date.now()}.json` },
      fields: 'id, name, modifiedTime'
    });
    res.json({ ok: true, file });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/documents/:id/undo', ensureAuth, async (req, res) => {
  try {
    const drive = driveClient(req);
    const { id } = req.params;
    const { timestampIso } = req.body || {};
    if (!timestampIso) return res.status(400).json({ ok: false, error: 'timestampIso required' });
    const target = new Date(timestampIso).getTime();
    const { data: revs } = await drive.revisions.list({
      fileId: id,
      fields: 'revisions(id, modifiedTime)'
    });
    const candidates = (revs.revisions || [])
      .filter(r => new Date(r.modifiedTime).getTime() <= target)
      .sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));
    if (!candidates.length) {
      return res.status(404).json({ ok: false, error: 'No revision at/earlier than timestamp' });
    }
    const chosen = candidates[0];
    const revContentResp = await drive.revisions.get(
      { fileId: id, revisionId: chosen.id, alt: 'media' },
      { responseType: 'stream' }
    );
    let body = '';
    revContentResp.data.on('data', chunk => (body += chunk));
    revContentResp.data.on('end', async () => {
      const media = { mimeType: 'application/json', body };
      const { data: updated } = await drive.files.update({
        fileId: id,
        media,
        fields: 'id, name, modifiedTime'
      });
      res.json({ ok: true, restoredFromRevision: chosen.id, file: updated });
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => console.log(`Drive backend listening on ${BASE_URL}`));
