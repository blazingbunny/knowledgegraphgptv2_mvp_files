const nodeStyles = [
  {
    selector: "node",
    style: {
      content: "data(id)",
      "text-valign": "bottom",
      "text-halign": "center",
      "text-wrap": "wrap",
      "background-color": "data(color)",
      "text-overflow-wrap": "whitespace",
      "font-size": "10px",
      "font-family": "Roboto, Arial, sans-serif",
    },
  },
  {
    selector: "node[label]",
    style: {
      label: "data(label)",
      "font-size": "10px",
      "font-family": "Roboto, Arial, sans-serif",
    },
  },
  {
    selector: "edge[label]",
    style: {
      label: "data(label)",
      width: 1,
      "edge-text-rotation": "autorotate",
      "font-size": "10px",
      "font-family": "Roboto, Arial, sans-serif",
    },
  },
];
const edgeStyles = [
  {
    selector: "edge",
    style: {
      "curve-style": "bezier",
      "target-arrow-shape": "triangle",
      "arrow-scale": 0.5,
      width: 1,
      content: "data(label)",
      "line-color": "#E0E0E0",
      "target-arrow-color": "#E0E0E0",
      "font-family": "Roboto, Arial, sans-serif",
    },
  },
];

const styles = [...nodeStyles, ...edgeStyles];

export default styles;
