import * as React from "react";
import { connect } from "react-redux";
import { EGraphRenderer, HetsGuiState } from "../reducers/reducer";
import VisibleDagGraph from "./VisibleDagGraph";

type GraphRendererProps = {
  renderer: EGraphRenderer;
  graph: { dgraph: any };
};

class GraphRenderer extends React.Component<GraphRendererProps, {}> {
  constructor(props: GraphRendererProps) {
    super(props);
  }

  render() {
    if (this.props.graph.dgraph === null) {
      return <h1>Please open a File!</h1>;
    } else {
      if (this.props.renderer === EGraphRenderer.GRAPHVIZ) {
        return <VisibleDagGraph width={800} height={600} />;
      }
    }
  }
}

const mapStateToProps = (state: HetsGuiState) => {
  return {
    renderer: state.openRenderer,
    graph: state.graph
  };
};

const GraphRendererContainer = connect(mapStateToProps)(GraphRenderer);

export default GraphRendererContainer;
