import * as vscode from "vscode";
import * as path from "path";

import { Utils } from "./utils";
import { URLType } from "./Types";
import { configure } from "vscode/lib/testrunner";

export function activate(context: vscode.ExtensionContext) {
  let panel: vscode.WebviewPanel;

  let webview = vscode.commands.registerCommand("hets-ide.showGraph", () => {
    panel = vscode.window.createWebviewPanel(
      "hets-ide",
      "Development Graph",
      vscode.ViewColumn.Beside,
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
  });

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "hets-ide.loadFile",
      (textEditor: vscode.TextEditor) => {
        if (!panel) {
          return;
        }

        let filename: string;
        const resource = textEditor.document.uri;

        if (resource.scheme === "file") {
          filename = path.basename(resource.fsPath);
        }

        const config = vscode.workspace.getConfiguration("hets-ide");

        Utils.queryHETSApi(
          config.get("server.hostname", "localhost"),
          config.get("server.port", 8000),
          `data/${filename}`,
          URLType.File,
          ""
        )
          .then(graph => {
            panel.webview.postMessage({ graph: graph });
          })
          .catch(err => {
            vscode.window.showErrorMessage(err);
          });
      }
    )
  );

  context.subscriptions.push(webview);
}

export function deactivate() {}
