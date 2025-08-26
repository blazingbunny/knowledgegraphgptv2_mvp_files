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

export const DEFAULT_PARAMS = {
  model: "openai/gpt-4o-mini",
  temperature: 0.3,
  max_tokens: 800,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

export const DEFAULT_ENDPOINT_KEY = "OPENROUTER";
