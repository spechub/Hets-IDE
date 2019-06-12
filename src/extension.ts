import * as vscode from "vscode";
import * as path from "path";

import { HetsRESTInterface } from "./HetsRESTInterface";

export let selectedNode = null;

export function activate(context: vscode.ExtensionContext) {
  let panel: vscode.WebviewPanel;

  let webview = vscode.commands.registerCommand("hets-ide.showGraph", () => {
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
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      undefined,
      context.subscriptions
    );
  });

  let proveCommand = vscode.commands.registerCommand(
    "hets-ide.prove",
    async () => {
      let textEditorPicks: vscode.QuickPickItem[] = [];
      vscode.window.visibleTextEditors.forEach((editor: vscode.TextEditor) => {
        textEditorPicks.push({
          label: path.basename(editor.document.fileName)
        });
      });

      let selectedEditor = await vscode.window.showQuickPick(textEditorPicks, {
        canPickMany: false
      });

      console.log(selectedEditor);

      if (!selectedEditor) {
        return;
      }

      const config = vscode.workspace.getConfiguration("hets-ide");
      const hetsInterface = new HetsRESTInterface(
        config.get("server.hostname", "localhost"),
        config.get("server.port", 8000)
      );

      let provers: JSON;
      try {
        provers = await hetsInterface.getProvers(
          `data/${selectedEditor.label}`,
          null,
          null
        );
      } catch (err) {
        vscode.window.showErrorMessage(err);
        return;
      }

      let proverPicks: vscode.QuickPickItem[] = [];
      provers["provers"].forEach(prover => {
        proverPicks.push({
          label: prover["name"],
          detail: prover["identifier"]
        });
      });

      const proverPick = await vscode.window.showQuickPick(proverPicks, {
        canPickMany: false
      });

      console.log(proverPick);

      const proveResponse = hetsInterface.prove(
        `data/${selectedEditor.label}`,
        null,
        "Nat__E1",
        proverPick.detail
      );

      console.log(proveResponse);
    }
  );

  let loadFileCommand = vscode.commands.registerCommand(
    "hets-ide.loadFile",
    async () => {
      if (!panel) {
        vscode.commands.executeCommand("hets-ide.showGraph");
      }

      let textEditorPicks: vscode.QuickPickItem[] = [];
      vscode.window.visibleTextEditors.forEach((editor: vscode.TextEditor) => {
        textEditorPicks.push({
          label: path.basename(editor.document.fileName),
          detail: editor.document.fileName
        });
      });

      let selectedEditor = await vscode.window.showQuickPick(textEditorPicks, {
        canPickMany: false
      });

      if (!selectedEditor) {
        return;
      }

      const textEditor = vscode.window.visibleTextEditors.find(
        editor => editor.document.fileName === selectedEditor.detail
      );

      let filename: string;
      const resource = textEditor.document.uri;

      if (resource.scheme === "file") {
        filename = path.basename(resource.fsPath);
      }

      const config = vscode.workspace.getConfiguration("hets-ide");

      const hetsInterface = new HetsRESTInterface(
        config.get("server.hostname", "localhost"),
        config.get("server.port", 8000)
      );

      hetsInterface
        .getDecisionGraph(`data/${filename}`, "")
        .then(graph => {
          panel.webview.postMessage({ graph: graph });
        })
        .catch(err => {
          vscode.window.showErrorMessage(err);
        });
    }
  );

  context.subscriptions.push(webview);
  context.subscriptions.push(proveCommand);
  context.subscriptions.push(loadFileCommand);
}

export function deactivate() {}
