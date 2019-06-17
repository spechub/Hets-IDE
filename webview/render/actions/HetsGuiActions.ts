import { Action } from "redux";
import * as dagreD3 from "dagre-d3";

import { EGraphRenderer } from "../reducers/reducer";
import { DGNode, DGLink } from "../../shared/DGraph";

export interface HetsGuiActions extends Action {
  graph?: {
    dgraph: dagreD3.graphlib.Graph;
    nodes: DGNode[];
    edges: DGLink[];
  };
  node?: dagreD3.Node;
  edge?: dagreD3.GraphEdge;
  renderer?: EGraphRenderer;
  size?: { width: number; height: number };
  id?: string;
}

export const SET_GRAPH = "SET_GRAPH";
export function changeGraphAction(
  graph: dagreD3.graphlib.Graph,
  nodes: DGNode[],
  edges: DGLink[]
): HetsGuiActions {
  return {
    type: SET_GRAPH,
    graph: { dgraph: graph, edges: edges, nodes: nodes }
  };
}

export const SELECT_NODE = "SELECT_NODE";
export function selectNodeAction(
  node: dagreD3.Node,
  id: string
): HetsGuiActions {
  return { type: SELECT_NODE, node: node, id: id };
}

export const SELECT_EDGE = "SELECT_EDGE";
export function selectEdgeAction(edge: dagreD3.GraphEdge): HetsGuiActions {
  return { type: SELECT_EDGE, edge: edge };
}

export const SET_RENDERER = "SET_RENDERER";
export function changeRendererAction(renderer: EGraphRenderer): HetsGuiActions {
  return { type: SET_RENDERER, renderer: renderer };
}

export const SET_SIZE = "SET_SIZE";
export function setSizeAction(size: {
  width: number;
  height: number;
}): HetsGuiActions {
  return { type: SET_SIZE, size: size };
}

export const HIDE_INTERNAL = "HIDE_INTERNAL";
export function hideInternalAction() {
  return { type: HIDE_INTERNAL };
}

export const SHOW_INTERNAL = "SHOW_INTERNAL";
export function showInternalAction() {
  return { type: SHOW_INTERNAL };
}
