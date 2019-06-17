import * as dagreD3 from "dagre-d3";
import * as d3 from "d3";

import { Node, GraphEdge } from "dagre-d3";

import {
  DGNode,
  DGLink,
  Axiom,
  Declaration,
  Theorem,
  Reference
} from "../../shared/DGraph";

type NLabel = {
  label?: string;
  axioms?: Axiom[];
  declarations?: Declaration[];
  theorems?: Theorem[];
  logic?: string;
  internal?: boolean;
  reference?: boolean;
  Reference?: Reference;
  style?: string;
  shape?: string;
};

export type NodeLabel = Node & NLabel;

type ELabel = {
  label?: string;
  style?: string;
  arrowheadStyle?: string;
  ConsStatus?: string;
  Rule?: string;
  Type?: string;
  GMorphism?: string[];
};

export type EdgeLabel = GraphEdge & ELabel;

const edgeStyle = (e: DGLink): string => {
  return e.Type.includes("Unproven")
    ? "stroke: #e5647a; fill: none; stroke-width: 2px;"
    : e.Type.includes("Proven")
    ? "stroke: #b8db95; fill: none; stroke-width: 2px;"
    : e.Type.includes("Hiding")
    ? "stroke: #6babef; fill: none; stroke-width: 2px;"
    : e.Type.includes("HetDefInc")
    ? "stroke: #a333c8; fill: none; stroke-dasharray: 5 2; stroke-width: 2px;"
    : "stroke: #999; fill: none; stroke-width: 2px;";
};

const arrowheadStyle = (e: DGLink): string => {
  return e.Type.includes("Unproven")
    ? "stroke: #e5647a; fill: #e5647a;"
    : e.Type.includes("Proven")
    ? "stroke: #b8db95; fill: #b8db95;"
    : e.Type.includes("Hiding")
    ? "stroke: #6babef; fill: #6babef;"
    : e.Type.includes("HetDefInc")
    ? "stroke: #a333c8; fill: #a333c8;"
    : "stroke: #999; fill: #999;";
};

const nodeStyle = (n: DGNode): { style: string; shape: string } => {
  return {
    style:
      n.Theorems.length > 0
        ? `fill: ${
            n.selected ? "#E8B0BA" : "white"
          }; stroke: #e5647a; stroke-width: 3.5px;`
        : `fill: ${
            n.selected ? "#E8B0BA" : "white"
          }; stroke: #b8db95; stroke-width: 3.5px;`,
    shape: n.reference ? "rect" : "ellipse"
  };
};

export function renderSelectedNode(
  _node: dagreD3.Node,
  id: string,
  nodes: DGNode[],
  edges: DGLink[]
): dagreD3.graphlib.Graph {
  nodes.forEach(node => {
    if (node.selected) {
      node.selected = false;
    }
  });
  nodes.find(n => n.id === ~~id).selected = true;
  return constructGraph(nodes, edges);
}

// TODO: optimize
// maybe pre filter *proven edges
export function removeInternalEdges(
  nodes: DGNode[],
  edges: DGLink[]
): dagreD3.graphlib.Graph {
  const graph = constructGraph(nodes, edges);

  for (const n of graph.nodes()) {
    if (!graph.node(n).internal) {
      continue;
    }

    const outEdges = graph.outEdges(n);

    // no in edges
    if (graph.inEdges(n).length <= 0) {
      outEdges.forEach(e => {
        graph.removeEdge(e.v, e.w);
      });
    } else {
      // in edges
      const inEdges = graph.inEdges(n);
      inEdges.forEach(eIn => {
        graph.removeEdge(eIn.v, eIn.w); // alle eingehenden Kanten löschen
        outEdges.forEach(eOut => {
          graph.removeEdge(eOut.v, eOut.w); // alle ausgehenden Kanten löschen
          if (eIn.v !== eOut.w) {
            graph.setEdge(eIn.v, eOut.w, {
              curve: d3.curveBasis,
              style:
                "stroke: #999; fill: none; stroke-dasharray: 5 2; stroke-width: 2px;",
              arrowheadStyle: "stroke: #999; fill: #999;"
            }); // neue Kante von source eingehender zu target ausgehender
          }
        });
      });
    }
    graph.removeNode(n);
  }

  return graph;
}

export function constructGraph(
  nodes: DGNode[],
  edges: DGLink[]
): dagreD3.graphlib.Graph {
  const graph = new dagreD3.graphlib.Graph({ multigraph: true })
    .setGraph({
      // ranker: "longest-path"
    })
    .setDefaultEdgeLabel(() => {
      return {};
    });

  nodes.forEach(n => {
    graph.setNode(n.id.toString(), {
      label: n.name,
      axioms: n.Axioms,
      declarations: n.Declarations,
      theorems: n.Theorems,
      logic: n.logic,
      internal: n.internal,
      reference: n.reference,
      Reference: n.Reference,
      ...nodeStyle(n)
    });
  });

  edges.forEach(e => {
    graph.setEdge(
      e.id_source.toString(),
      e.id_target.toString(),
      {
        label: e.name ? e.name : "",
        curve: d3.curveBasis,
        style: edgeStyle(e),
        arrowheadStyle: arrowheadStyle(e),
        ConsStatus: e.ConsStatus,
        Rule: e.Rule,
        Type: e.Type,
        GMorphism: formatGMorphism(e.GMorphism.name)
      },
      e.linkid.toString()
    );
  });

  return graph;
}

const formatGMorphism = (g: string): string[] => {
  const parts = g.split(";");
  return parts.map((p: string) => {
    return p.replace("2", " → ");
  });
};
