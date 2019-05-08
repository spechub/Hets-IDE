export interface DGraph {
  DGLinks: DGLink[];
  DGNodes: DGNode[];
  Globals: Global[];
  filename: string;
  libname: string;
  dgedges: number;
  dgnodes: number;
  nextlinkid: number;
}

export interface DGLink {
  ConsStatus?: string;
  GMorphism: GMorphism;
  Type: string;
  id_source: number;
  id_target: number;
  linkid: number;
  source: string;
  target: string;
  name?: string;
  Rule?: string;
}

export interface Reference {
  library: string;
  location: string;
  node: string;
}

export interface DGNode {
  Axioms: Axiom[];
  Declarations: Declaration[];
  Theorems: Theorem[];
  id: number;
  logic: string;
  name: string;
  range: string; // TODO: see range in Global
  reference: boolean;
  Reference: Reference;
  refname: string;
  relxpath: string;
  internal: boolean;
}

export class DGNode {
  constructor(id: number) {
    return {
      Axioms: [],
      Declarations: [],
      Theorems: [],
      id: id,
      logic: "",
      name: "DUMMY",
      range: "",
      reference: false,
      Reference: null,
      refname: "",
      relxpath: "",
      internal: true
    };
  }
}

export interface Global {
  annotation: string;
  range: string; // TODO: actually filepath:line.char-line.char
}

export interface GMorphism {
  name: string;
}

export interface Axiom {
  Axiom: string;
  SenSymbols: SenSymbol[];
  name: string;
  range: string;
}

export interface SenSymbol {
  Symbol: string;
  iri: string;
  kind: string;
  name: string;
  range: string;
}

export interface Declaration {
  Symbol: string;
  iri: string;
  kind: string;
  name: string;
  range: string;
}

export interface Theorem {
  SenSymbols: SenSymbol[];
  Theorem: string;
  name: string;
  range: string;
  status: string;
}
