// client/src/constants.js
export const LAYOUTS = {
  Simple: "FCOSE",
  Hierarchical: "DAGRE",
  Circle: "AVSDF",
};

const ANIMATION_DURATION = 1000; // ms
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
  fitSelector: undefined,
  animateOnFit: () => false,
  fitAnimationDuration: 1000,
  sliderHandleIcon: "fa fa-minus",
  zoomInIcon: "fa fa-plus",
  zoomOutIcon: "fa fa-minus",
  resetIcon: "fa fa-expand",
};
