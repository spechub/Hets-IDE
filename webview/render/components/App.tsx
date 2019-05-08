import * as React from "react";

import DataReceiverContainer from "../containers/DataReceiver";
import GraphRendererContainer from "../containers/GraphRenderer";

export default class App extends React.Component {
  render() {
    return (
      <>
        <DataReceiverContainer />
        <GraphRendererContainer />
      </>
    );
  }
}
