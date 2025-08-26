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
import { DEFAULT_PARAMS, LAYOUTS, DEFAULT_ENDPOINT_KEY } from "./constants";
import LayoutSelector from "./LayoutSelector";
import { drive } from "./driveClient";

function App() {
  const [prompt, setPrompt] = useState("");
  const [graphState, dispatch] = useReducer(graphReducer, initialState);
  const [option, setOptions] = useState(LAYOUTS.FCOSE);
  const [loading, setLoading] = useState(false);
  const [endpointKey, setEndpointKey] = useState(DEFAULT_ENDPOINT_KEY);
  const [file, setFile] = useState("");

  const handlePromptChange = (e) => setPrompt(e.target.value);
  const handleEndpointChange = (e) => setEndpointKey(e.target.value);

  const handleJSONImport = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (e2) => {
      try {
        const data = JSON.parse(e2.target.result);
        setFile(null);
        const result = restructureGraph(tuplesToGraph(cleanJSONTuples(data)));
        dispatch({ type: ACTIONS.ADD_NODES_AND_EDGES, payload: result });
      } catch (err) {
        console.info(err);
        alert("Invalid JSON");
      }
    };
  };

  const fetchGraph = () => {
    setLoading(true);
    fetch(main)
      .then((res) => res.text())
      .then((text) => text.replace("$prompt", prompt))
      .then((promptText) => {
        const params = {
          ...DEFAULT_PARAMS,
          messages: [{ role: "system", content: promptText }],
        };
        return fetch("http://localhost:4000/api/llm/chat", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ params }),
        });
      })
      .then((r) => r.json())
      .then((data) => {
        setLoading(false);
        if (!data?.ok) throw new Error(data?.error || "LLM proxy error");
        const text = data.text || "";
        const result = restructureGraph(tuplesToGraph(cleanTuples(text)));
        dispatch({ type: ACTIONS.ADD_NODES_AND_EDGES, payload: result });
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        alert("Request failed. Check server API key and logs.");
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
    prompt,
  });

  const restoreGraphContent = (content) => {
    try {
      const { nodes = [], edges = [], layout, prompt: p } = content || {};
      dispatch({ type: ACTIONS.CLEAR_GRAPH });
      dispatch({ type: ACTIONS.ADD_NODES_AND_EDGES, payload: { nodes, edges } });
      if (layout) setOptions(layout);
      if (p) setPrompt(p);
    } catch (e) {
      console.error("Failed to load content", e);
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
    if (!currentFile?.id) return alert("No file open. Use New or Open.");
    await drive.saveDoc(currentFile.id, getGraphContent());
    alert("Saved (new revision created)");
  };

  const onOpen = async () => {
    const list = await drive.listDocs();
    const pick = list.files?.[0];
    if (!pick) return alert("No files found. Create one first.");
    const { file, content } = await drive.openDoc(pick.id);
    setCurrentFile(file);
    restoreGraphContent(content);
    alert(`Opened ${file.name}`);
  };

  const onSaveAs = async () => {
    if (!currentFile?.id) return alert("Open a file first.");
    const newName = window.prompt("New name:", `copy-${currentFile.name}`) || undefined;
    const { file } = await drive.saveAsDoc(currentFile.id, newName);
    setCurrentFile(file);
    alert(`Saved As ${file.name}`);
  };

  const onUndoTo = async () => {
    if (!currentFile?.id) return alert("Open a file first.");
    if (!undoTime) return alert("Enter an ISO timestamp (e.g., 2025-08-26T10:00:00Z)");
    await drive.undoTo(currentFile.id, undoTime);
    const { file, content } = await drive.openDoc(currentFile.id);
    setCurrentFile(file);
    restoreGraphContent(content);
    alert(`Restored to revision at/<= ${undoTime}`);
  };

  return (
    <div className="App">
      <div className="mainContainer">
        <h1 className="title">KnowledgeGraph GPT</h1>
        <p className="text">Turn text into a knowledge graph.</p>

        <div style={{ marginBottom: 10 }}>
          <label style={{ marginRight: 8, color: "#555" }}>API Endpoint:</label>
          <select value={endpointKey} onChange={handleEndpointChange}>
            <option value="OPENROUTER">OpenRouter (default)</option>
            <option value="OPENAI">OpenAI</option>
          </select>
        </div>

        <input
          type="text"
          onChange={handlePromptChange}
          value={prompt}
          className="promptInput"
          placeholder="Enter your prompt"
        />

        <button onClick={handleSubmit} className="submitButton" disabled={loading}>
          {loading ? "Loading" : "Generate"}
        </button>
        <br />

        <div className="buttonContainer">
          <button
            className="submitButton"
            style={{ marginLeft: 5 }}
            onClick={() => dispatch({ type: ACTIONS.CLEAR_GRAPH })}
          >
            Clear
          </button>
          <button
            className="submitButton"
            style={{ marginLeft: 5 }}
            onClick={() => exportData(graphState?.edges)}
            disabled={graphState?.edges?.length < 1}
          >
            Export JSON
          </button>
          <label className="custom-file-upload">
            <input type="file" accept=".json" onChange={handleJSONImport} value={file} />
            Import JSON
          </label>
          <LayoutSelector option={option} setOptions={setOptions} />

          {!session?.authenticated ? (
            <button className="submitButton" onClick={onDriveLogin}>
              Sign in with Google Drive
            </button>
          ) : (
            <>
              <button className="submitButton" onClick={onNew}>New</button>
              <button className="submitButton" onClick={onOpen}>Open (latest)</button>
              <button className="submitButton" onClick={onSave}>Save</button>
              <button className="submitButton" onClick={onSaveAs}>Save As</button>
              <input
                className="promptInput"
                style={{ width: 320 }}
                placeholder="ISO time for Undo (e.g., 2025-08-26T10:00:00Z)"
                value={undoTime}
                onChange={(e) => setUndoTime(e.target.value)}
              />
              <button className="submitButton" onClick={onUndoTo}>Undo to time</button>
            </>
          )}
        </div>
      </div>

      <Graph data={graphState} layout={option} />

      <div className="footer">
        <p>© {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

export default App;
