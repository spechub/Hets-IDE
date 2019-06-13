import * as vscode from "vscode";
import * as path from "path";

export let panel: vscode.WebviewPanel;
export let selectedNode: string = null;

const selectedNodeStatusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right,
  100
);

export function clearSelectedNode() {
  selectedNode = null;
  selectedNodeStatusBarItem.hide();
}

export function createWebview(context: vscode.ExtensionContext) {
  panel = vscode.window.createWebviewPanel(
    "hets-ide",
    "Development Graph",
    { preserveFocus: true, viewColumn: vscode.ViewColumn.Beside },
    {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(context.extensionPath, "dist"))
      ]
    }
  );

  const scriptPathOnDisk = vscode.Uri.file(
    path.join(context.extensionPath, "dist", "webview", "webview.js")
  );
  const scriptUri = scriptPathOnDisk.with({ scheme: "vscode-resource" });

  panel.webview.html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <base href="${vscode.Uri.file(
      path.join(context.extensionPath, "dist", "webview")
    ).with({ scheme: "vscode-resource" })}/">
  </head>
  <body>
    <div id="content"></div>
    <script src="${scriptUri}"></script>
  </body>
  </html>`;

  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case "node-selected":
          selectedNode = message.text;
          selectedNodeStatusBarItem.hide();
          selectedNodeStatusBarItem.text = `Selected node: ${selectedNode}`;
          selectedNodeStatusBarItem.show();
          return;
      }
    },
    undefined,
    context.subscriptions
  );

  panel.onDidDispose(
    () => {
      this.panel = null;
    },
    this,
    context.subscriptions
  );
}
