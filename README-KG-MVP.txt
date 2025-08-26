# Knowledge Graph GPT (MVP with Google Drive Save/Open/Undo)

This bundle contains **only the files to add/replace** in your new repository to get the MVP working.

## Structure
```
repo/
  client/                 # your existing CRA app (React)
    .env.example          # NEW - client env (React)
    src/
      App.css             # UPDATED - modern UI
      App.js              # UPDATED - Drive buttons + env support
      Graph.js            # UPDATED - responsive container tweaks
      constants.js        # UPDATED - env-driven endpoint+keys
      driveClient.js      # NEW - tiny REST client for backend
      styles.js           # UPDATED - label font-size tweaks
      __test__/App.test.js# UPDATED - test adapts to manual-key toggle
  server/                 # NEW - tiny backend (Express + Drive)
    .env.example
    index.js
    package.json
  compose.yaml            # UPDATED - local client+server
```

## How to use
1) Place these folders/files into your new repo.
2) **Backend** (`server/`)
   ```bash
   cd server
   npm i
   cp .env.example .env   # fill GOOGLE_CLIENT_ID/SECRET, SESSION_SECRET
   npm run dev
   ```
3) **Frontend** (`client/`)
   ```bash
   cd client
   npm i
   cp .env.example .env   # optional: set REACT_APP_DEFAULT_ENDPOINT and keys
   npm start
   ```
4) Open http://localhost:3000 and **Sign in with Google Drive** from the UI.
5) Use **New / Open / Save / Save As / Undo to time** buttons.

> For a production deployment, you can `docker compose up -d` from repo root.
