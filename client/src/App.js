import { useEffect, useReducer, useState } from "react";
import Graph from "./Graph";
import main from "./prompt/prompt.txt";
import { graphReducer, initialState } from "./graphReducer";
import { ACTIONS } from "./actions";
import {
  cleanJSONTuples,
  cleanTuples,
  exportData,
  restructureGraph,
  tuplesToGraph,
} from "./util";
import "./App.css";
import {
  DEFAULT_PARAMS,
  LAYOUTS,
  requestOptions,
  ENDPOINTS,
  DEFAULT_ENDPOINT_KEY,
  ENV_KEYS,
} from "./constants";
import GithubLogo from "./github-mark.png";
import LayoutSelector from "./LayoutSelector";
import { drive } from "./driveClient";

function App() {
  const [prompt, setPrompt] = useState("");
  const handlePromptChange = (e) => setPrompt(e.target.value);

  const [graphState, dispatch] = useReducer(graphReducer, initialState);
  const [option, setOptions] = useState(LAYOUTS.FCOSE);
  const [loading, setLoading] = useState(false);

  const [endpointKey, setEndpointKey] = useState(DEFAULT_ENDPOINT_KEY);
  const handleEndpointChange = (e) => setEndpointKey(e.target.value);

  const [useManualKey, setUseManualKey] = useState(false);
  const [key, setKey] = useState(ENV_KEYS[DEFAULT_ENDPOINT_KEY] || "");
  const handleKeyChange = (e) => setKey(e.target.value);

  useEffect(() => {
    if (!useManualKey) {
      setKey(ENV_KEYS[endpointKey] || "");
    }
  }, [endpointKey, useManualKey]);

  const [file, setFile] = useState("");

  const handleJSONImport = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (e2) => {
      let data;
      try {
        data = JSON.parse(e2.target.result);
      } catch (err) {
        console.info(err);
      }
      setFile(null);
      const result = restructureGraph(tuplesToGraph(cleanJSONTuples(data)));
      dispatch({ type: ACTIONS.ADD_NODES_AND_EDGES, payload: result });
    };
  };

  const fetchGraph = () => {
    if (!key) {
      alert(
        "No API key found. Either set it in your .env or enable 'Use manual API key' and paste one."
      );
      return;
    }

    setLoading(true);
    fetch(main)
      .then((res) => res.text())
      .then((text) => text.replace("$prompt", prompt))
      .then((promptText) => {
        const params = {
          ...DEFAULT_PARAMS,
          messages: [{ role: "system", content: promptText }],
        };

        const url = ENDPOINTS[endpointKey];

        const hdrs = {
          ...requestOptions.headers,
          Authorization: "Bearer " + key,
        };

        if (endpointKey === "OPENROUTER") {
          hdrs["X-Title"] = "KnowledgeGraph GPT";
        }

        return fetch(url, {
          ...requestOptions,
          headers: hdrs,
          body: JSON.stringify(params),
        });
      })
      .then((response) => response.json())
      .then((data) => {
        setLoading(false);
        const text = data?.choices?.[0]?.message?.content || "";
        const result = restructureGraph(tuplesToGraph(cleanTuples(text)));
        dispatch({ type: ACTIONS.ADD_NODES_AND_EDGES, payload: result });
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        alert(
          "Request failed. Verify endpoint, model, and API key (or check console)."
        );
      });
  };

  const handleSubmit = () => fetchGraph();

  const [session, setSession] = useState(null);
  const [currentFile, setCurrentFile] = useState(null); // { id, name }
  const [undoTime, setUndoTime] = useState("");

  useEffect(() => {
    drive.getSession().then(setSession).catch(() => setSession(null));
  }, []);

  const getGraphContent = () => ({
    nodes: graphState.nodes,
    edges: graphState.edges,
    layout: option,
    prompt
  });

  const restoreGraphContent = (content) => {
    try {
      const { nodes = [], edges = [], layout, prompt: p } = content || {};
      dispatch({ type: ACTIONS.CLEAR_GRAPH });
      dispatch({ type: ACTIONS.ADD_NODES_AND_EDGES, payload: { nodes, edges } });
      if (layout) setOptions(layout);
      if (p) setPrompt(p);
    } catch (e) {
      console.error('Failed to load content', e);
    }
  };

  const onDriveLogin = () => drive.login();

  const onNew = async () => {
    const name = prompt?.trim() ? `kg-${prompt.substring(0, 16)}.json` : `kg-${Date.now()}.json`;
    const { file } = await drive.createDoc(name, getGraphContent());
    setCurrentFile(file);
    alert(`Created ${file.name}`);
  };

  const onSave = async () => {
    if (!currentFile?.id) return alert('No file open. Use New or Open.');
    await drive.saveDoc(currentFile.id, getGraphContent());
    alert('Saved (new revision created)');
  };

  const onOpen = async () => {
    const list = await drive.listDocs();
    const pick = list.files?.[0];
    if (!pick) return alert('No files found. Create one first.');
    const { file, content } = await drive.openDoc(pick.id);
    setCurrentFile(file);
    restoreGraphContent(content);
    alert(`Opened ${file.name}`);
  };

  const onSaveAs = async () => {
    if (!currentFile?.id) return alert('Open a file first.');
    const newName = window.prompt('New name:', `copy-${currentFile.name}`) || undefined;
    const { file } = await drive.saveAsDoc(currentFile.id, newName);
    setCurrentFile(file);
    alert(`Saved As ${file.name}`);
  };

  const onUndoTo = async () => {
    if (!currentFile?.id) return alert('Open a file first.');
    if (!undoTime) return alert('Enter an ISO timestamp (e.g., 2025-08-26T10:00:00Z)');
    await drive.undoTo(currentFile.id, undoTime);
    const { file, content } = await drive.openDoc(currentFile.id);
    setCurrentFile(file);
    restoreGraphContent(content);
    alert(`Restored to revision at/<= ${undoTime}`);
  };

  return (
    <div className="App">
      <header className="appHeader">
        <h1>KnowledgeGraph GPT</h1>
        <span className="subtle">Turn text into a knowledge graph.</span>
      </header>

      <div className="mainContainer card">
        <div className="row">
          <div className="field">
            <label>API Endpoint</label>
            <select
              className="select"
              value={endpointKey}
              onChange={handleEndpointChange}
            >
              <option value="OPENROUTER">OpenRouter (default)</option>
              <option value="OPENAI">OpenAI</option>
            </select>
          </div>

          <div className="field switchRow">
            <label className="switch">
              <input
                type="checkbox"
                checked={useManualKey}
                onChange={(e) => setUseManualKey(e.target.checked)}
              />
              <span className="slider" />
            </label>
            <span className="switchLabel">Use manual API key</span>
          </div>
        </div>

        {useManualKey && (
          <div className="field">
            <label>
              {endpointKey === "OPENROUTER"
                ? "OpenRouter API Key"
                : "OpenAI API Key"}
            </label>
            <input
              type="password"
              onChange={handleKeyChange}
              value={key}
              className="input"
              placeholder={
                endpointKey === "OPENROUTER"
                  ? "Enter your OpenRouter API Key"
                  : "Enter your OpenAI API Key"
              }
            />
          </div>
        )}

        <div className="field">
          <label>Prompt</label>
          <input
            type="text"
            onChange={handlePromptChange}
            value={prompt}
            className="input"
            placeholder="Enter your prompt"
          />
        </div>

        <div className="actions">
          <button
            onClick={handleSubmit}
            className="button primary"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate"}
          </button>

          <button
            className="button"
            onClick={() => dispatch({ type: ACTIONS.CLEAR_GRAPH })}
          >
            Clear
          </button>

          <button
            className="button"
            onClick={() => exportData(graphState?.edges)}
            disabled={graphState?.edges?.length < 1}
          >
            Export JSON
          </button>

          <label className="button fileButton">
            <input
              type="file"
              accept=".json"
              onChange={handleJSONImport}
              value={file}
            />
            Import JSON
          </label>

          <LayoutSelector option={option} setOptions={setOptions} />

          {!session?.authenticated ? (
            <button className="button" onClick={onDriveLogin}>Sign in with Google Drive</button>
          ) : (
            <>
              <button className="button" onClick={onNew}>New</button>
              <button className="button" onClick={onOpen}>Open (latest)</button>
              <button className="button" onClick={onSave}>Save</button>
              <button className="button" onClick={onSaveAs}>Save As</button>
              <input
                className="input"
                style={{ maxWidth: 260 }}
                placeholder="ISO time for Undo (e.g., 2025-08-26T10:00:00Z)"
                value={undoTime}
                onChange={(e) => setUndoTime(e.target.value)}
              />
              <button className="button" onClick={onUndoTo}>Undo to time</button>
            </>
          )}
        </div>
      </div>
      <Graph data={graphState} layout={option} />

      <div className="footer">
        <p>© {new Date().getFullYear()}</p>
        <a
          href="https://github.com/blazingbunny/KnowledgeGraphGPTv2"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub repository"
        >
          <img
            src={GithubLogo}
            alt="github"
            width={20}
            height={20}
            className="github"
          />
        </a>
      </div>
    </div>
  );
}

export default App;
