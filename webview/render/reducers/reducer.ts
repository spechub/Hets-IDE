import * as dagreD3 from "dagre-d3";

import {
  HetsGuiActions,
  SELECT_NODE,
  SET_GRAPH,
  SET_RENDERER,
  SET_SIZE,
  HIDE_INTERNAL,
  SHOW_INTERNAL,
  SELECT_EDGE
} from "../actions/HetsGuiActions";
import {
  removeInternalEdges,
  constructGraph,
  renderSelectedNode
} from "../actions/GraphHelper";
import { DGNode, DGLink } from "../../shared/DGraph";

export enum EGraphRenderer {
  GRAPHVIZ
}

export type HetsGuiState = {
  graph: {
    dgraph: dagreD3.graphlib.Graph;
    nodes: DGNode[];
    edges: DGLink[];
  };
  selectedNode: dagreD3.Node;
  selectedEdge: dagreD3.GraphEdge;
  openRenderer: EGraphRenderer;
  svgSize: { width: number; height: number };
  internalHidden: boolean;
};

const initialState: HetsGuiState = {
  graph: {
    dgraph: null,
    nodes: [],
    edges: []
  },
  selectedNode: null,
  selectedEdge: null,
  openRenderer: EGraphRenderer.GRAPHVIZ,
  svgSize: { width: 0, height: 0 },
  internalHidden: false
};

export function hetsGui(
  state: HetsGuiState = initialState,
  action: HetsGuiActions
): HetsGuiState {
  switch (action.type) {
    case SELECT_NODE:
      return Object.assign({}, state, {
        graph: {
          dgraph: renderSelectedNode(
            action.node,
            action.id,
            state.graph.nodes,
            state.graph.edges
          ),
          nodes: state.graph.nodes,
          edges: state.graph.edges
        },
        selectedNode: action.node
      });
    case SELECT_EDGE:
      return Object.assign({}, state, {
        selectedEdge: action.edge
      });
    case SET_GRAPH:
      return Object.assign({}, state, {
        graph: action.graph
      });
    case SET_RENDERER:
      return Object.assign({}, state, {
        openRenderer: action.renderer
      });
    case SET_SIZE:
      return Object.assign({}, state, {
        openRenderer: action.size
      });
    case HIDE_INTERNAL:
      return Object.assign({}, state, {
        graph: {
          dgraph: removeInternalEdges(state.graph.nodes, state.graph.edges),
          nodes: state.graph.nodes,
          edges: state.graph.edges
        },
        internalHidden: true
      });
    case SHOW_INTERNAL:
      return Object.assign({}, state, {
        graph: {
          dgraph: constructGraph(state.graph.nodes, state.graph.edges),
          nodes: state.graph.nodes,
          edges: state.graph.edges
        },
        internalHidden: false
      });
    default:
      return state;
  }
}
