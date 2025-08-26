export const requestOptions = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

export const LAYOUTS = {
  Simple: "FCOSE",
  Hierarchical: "DAGRE",
  Circle: "AVSDF",
};

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
  animateOnFit: () => false,
  fitAnimationDuration: 1000,
  sliderHandleIcon: "fa fa-minus",
  zoomInIcon: "fa fa-plus",
  zoomOutIcon: "fa fa-minus",
  resetIcon: "fa fa-expand",
};

export const DEFAULT_PARAMS = {
  model: "gpt-4-1106-preview",
  temperature: 0.3,
  max_tokens: 800,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

export const ENDPOINTS = {
  OPENROUTER: "https://openrouter.ai/api/v1/chat/completions",
  OPENAI: "https://api.openai.com/v1/chat/completions",
};

export const DEFAULT_ENDPOINT_KEY =
  process.env.REACT_APP_DEFAULT_ENDPOINT === "OPENAI" ? "OPENAI" : "OPENROUTER";

export const ENV_KEYS = {
  OPENROUTER: process.env.REACT_APP_OPENROUTER_API_KEY || "",
  OPENAI: process.env.REACT_APP_OPENAI_API_KEY || "",
};
