import {
  DGraph,
  DGLink,
  DGNode,
  Global,
  GMorphism,
  Axiom,
  Declaration,
  Theorem,
  Reference,
  SenSymbol
} from "../../shared/DGraph";

interface Serializable<T> {
  deserialize(input: any): T;
}

class GMorphismImpl implements GMorphism, Serializable<GMorphism> {
  name: string;

  deserialize(input: any): GMorphism {
    this.name = input["name"] ? input["name"] : "";

    return this;
  }
}

class DGLinkImpl implements DGLink, Serializable<DGLink> {
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

  deserialize(input: any): DGLink {
    this.ConsStatus = input["ConsStatus"] ? input["ConsStatus"] : null;
    this.Type = input["Type"];
    this.id_source = input["id_source"];
    this.id_target = input["id_target"];
    this.linkid = input["linkid"];
    this.source = input["source"];
    this.target = input["target"];
    this.name = input["name"] ? input["name"] : null;
    this.Rule = input["Rule"] ? input["Rule"] : null;
    this.GMorphism = new GMorphismImpl().deserialize(input["GMorphism"]);

    return this;
  }
}

class ReferenceImpl implements Reference, Serializable<Reference> {
  library: string;
  location: string;
  node: string;

  deserialize(input: any) {
    this.library = input["library"];
    this.location = input["location"];
    this.node = input["node"];

    return this;
  }
}

class SenSymbolImpl implements SenSymbol, Serializable<SenSymbol> {
  Symbol: string;
  iri: string;
  kind: string;
  name: string;
  range: string;

  deserialize(input: any): SenSymbol {
    this.Symbol = input["Symbol"];
    this.iri = input["iri"];
    this.kind = input["kind"];
    this.name = input["name"];
    this.range = input["range"];

    return this;
  }
}

class AxiomImpl implements Axiom, Serializable<Axiom> {
  Axiom: string;
  SenSymbols: SenSymbol[];
  name: string;
  range: string;

  deserialize(input: any): Axiom {
    this.Axiom = input["Axiom"];
    this.name = input["name"];
    this.range = input["range"];

    this.SenSymbols = [];
    if (input["SenSymbols"]) {
      input["SenSymbols"].forEach((symbol: any) => {
        this.SenSymbols.push(new SenSymbolImpl().deserialize(symbol));
      });
    }

    return this;
  }
}

class DeclarationImpl implements Declaration, Serializable<Declaration> {
  Symbol: string;
  iri: string;
  kind: string;
  name: string;
  range: string;

  deserialize(input: any): Declaration {
    this.Symbol = input["Symbol"];
    this.iri = input["iri"];
    this.kind = input["kind"];
    this.name = input["name"];
    this.range = input["range"];

    return this;
  }
}

class TheoremImpl implements Theorem, Serializable<Theorem> {
  SenSymbols: SenSymbol[];
  Theorem: string;
  name: string;
  range: string;
  status: string;

  deserialize(input: any): Theorem {
    this.Theorem = input["Theorem"];
    this.name = input["name"];
    this.range = input["range"];
    this.status = input["status"];

    this.SenSymbols = [];
    if (input["SenSymbols"]) {
      input["SenSymbols"].forEach((symbol: any) => {
        this.SenSymbols.push(new SenSymbolImpl().deserialize(symbol));
      });
    }

    return this;
  }
}

class DGNodeImpl implements DGNode, Serializable<DGNode> {
  Axioms: Axiom[];
  Declarations: Declaration[];
  Theorems: Theorem[];
  id: number;
  logic: string;
  name: string;
  range: string;
  reference: boolean;
  Reference: Reference;
  refname: string;
  relxpath: string;
  internal: boolean;

  deserialize(input: any): DGNode {
    this.id = input["id"];
    this.logic = input["logic"];
    this.name = input["name"];
    this.range = input["range"];
    this.reference = input["reference"];
    this.refname = input["refname"];
    this.relxpath = input["relxpath"];
    this.internal = input["internal"];

    this.Reference = null;
    if (input["Reference"]) {
      this.Reference = new ReferenceImpl().deserialize(input["Reference"]);
    }

    this.Axioms = [];
    if (input["Axioms"]) {
      input["Axioms"].forEach((axiom: any) => {
        this.Axioms.push(new AxiomImpl().deserialize(axiom));
      });
    }

    this.Declarations = [];
    if (input["Declarations"]) {
      input["Declarations"].forEach((decl: any) => {
        this.Declarations.push(new DeclarationImpl().deserialize(decl));
      });
    }

    this.Theorems = [];
    if (input["Theorems"]) {
      input["Theorems"].forEach((theo: any) => {
        this.Theorems.push(new TheoremImpl().deserialize(theo));
      });
    }

    return this;
  }
}

class GlobalImpl implements Global, Serializable<Global> {
  annotation: string;
  range: string;

  deserialize(input: any): Global {
    this.annotation = input["annotation"];
    this.range = input["range"];

    return this;
  }
}

class DGraphImpl implements DGraph, Serializable<DGraph> {
  DGLinks: DGLink[];
  DGNodes: DGNode[];
  Globals: Global[];
  filename: string;
  libname: string;
  dgedges: number;
  dgnodes: number;
  nextlinkid: number;

  deserialize(input: any): DGraph {
    this.filename = input["filename"];
    this.libname = input["libname"];
    this.dgedges = input["dgedges"];
    this.dgnodes = input["dgnodes"];
    this.nextlinkid = input["nextlinkid"];

    this.DGLinks = [];
    if (input["DGLink"]) {
      input["DGLink"].forEach((dglink: any) => {
        this.DGLinks.push(new DGLinkImpl().deserialize(dglink));
      });
    }

    this.DGNodes = [];
    if (input["DGNode"]) {
      input["DGNode"].forEach((dgnode: any) => {
        this.DGNodes.push(new DGNodeImpl().deserialize(dgnode));
      });
    }

    this.Globals = [];
    if (input["Global"]) {
      input["Global"].forEach((global: any) => {
        this.Globals.push(new GlobalImpl().deserialize(global));
      });
    }

    return this;
  }
}

export class DGraphParser {
  public dgraph: DGraph;

  constructor(dgraph: any) {
    this.parse(dgraph);
  }

  private parse(dgraph: any) {
    if (!dgraph || dgraph === "") {
      this.dgraph = null;
      return;
    }
    this.dgraph = new DGraphImpl().deserialize(dgraph["DGraph"]);
    this.setTitle(this.dgraph.filename);
  }

  private setTitle(file: string) {
    // remote.getCurrentWindow().setTitle(
    //   `Hets - ${file
    //     .split("/")
    //     .slice(-1)
    //     .pop()}`
    // );
  }
}
