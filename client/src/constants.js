// client/src/constants.js

// --- Networking helpers (safe defaults for CRA fetches) ---
export const requestOptions = {
  method: "POST",
  headers: { "Content-Type": "application/json" },
};

// --- Model defaults (used by App to build the LLM request) ---
export const DEFAULT_PARAMS = {
  // This is only a hint; the server ultimately proxies to OpenRouter
  model: "openai/gpt-4o-mini",
  temperature: 0.3,
  max_tokens: 800,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

// --- Layout names for the dropdown ---
export const LAYOUTS = {
  Simple: "FCOSE",
  Hierarchical: "DAGRE",
  Circle: "AVSDF",
};

// --- Cytoscape layout options ---
const ANIMATION_DURATION = 1000;
const ANIMATION_EASING = "ease-in-sine";

export const LAYOUT_OPTIONS = {
  FCOSE: {
    name: "fcose",
    idealEdgeLength: 200,
    randomize: true,
    nodeDimensionsIncludeLabels: true,
    animationDuration: ANIMATION_DURATION,
    animationEasing: ANIMATION_EASING,
  },
  DAGRE: {
    name: "dagre",
    nodeSep: 30,
    edgeSep: 30,
    rankSep: 30,
    fit: true,
    rankDir: "TB",
    animate: true,
    animationDuration: ANIMATION_DURATION,
    animationEasing: ANIMATION_EASING,
    minLen: () => 2,
    nodeDimensionsIncludeLabels: true,
  },
  AVSDF: {
    name: "avsdf",
    refresh: 30,
    fit: true,
    padding: 10,
    ungrabifyWhileSimulating: false,
    animate: "end",
    animationDuration: ANIMATION_DURATION,
    animationEasing: ANIMATION_EASING,
    nodeSeparation: 100,
  },
};

// --- Pan/zoom widget options ---
export const PANZOOM_OPTIONS = {
  zoomFactor: 0.05,
  zoomDelay: 45,
  minZoom: 0.1,
  maxZoom: 10,
  fitPadding: 50,
  panSpeed: 10,
  panDistance: 10,
  panDragAreaSize: 75,
  panMinPercentSpeed: 0.25,
  panInactiveArea: 8,
  panIndicatorMinOpacity: 0.5,
  zoomOnly: false,
  fitSelector: undefined,
  animateOnFit: () => false,
  fitAnimationDuration: 1000,
  sliderHandleIcon: "fa fa-minus",
  zoomInIcon: "fa fa-plus",
  zoomOutIcon: "fa fa-minus",
  resetIcon: "fa fa-expand",
};

// --- Optional: endpoint selector stubs (keeps older App.js variants happy) ---
export const DEFAULT_ENDPOINT_KEY = "OPENROUTER";
export const ENV_KEYS = { OPENROUTER: "", OPENAI: "" };
export const ENDPOINTS = {
  OPENROUTER: "/api/llm/chat",
  OPENAI: "/api/llm/chat",
};
