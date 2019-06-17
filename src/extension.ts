import * as vscode from "vscode";
import * as path from "path";

import { HetsRESTInterface } from "./HetsRESTInterface";
import {
  createWebview,
  selectedNode,
  panel,
  clearSelectedNode
} from "./WebviewManager";

export function activate(context: vscode.ExtensionContext) {
  let fileLoadedInPane: string = null;

  const proverOutputChannel = vscode.window.createOutputChannel(
    "Hets: Prover Output"
  );

  let proveCommand = vscode.commands.registerCommand(
    "hets-ide.prove",
    async () => {
      if (!fileLoadedInPane) {
        vscode.window.showErrorMessage("Please open the development graph");
        return;
      }

      if (!selectedNode) {
        vscode.window.showErrorMessage(
          "Please select a node in the development graph."
        );
        return;
      }

      const config = vscode.workspace.getConfiguration("hets-ide");
      const hetsInterface = new HetsRESTInterface(
        config.get("server.hostname", "localhost"),
        config.get("server.port", 8000)
      );

      let provers: JSON;
      provers = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: `Fetching available provers for node '${selectedNode}'!`,
          cancellable: false
        },
        _progress => {
          return hetsInterface.getProvers(
            `data/${fileLoadedInPane}`,
            null,
            null
          );
        }
      );

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

      if (!proverPick) {
        return;
      }

      const proveResponse = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: `Proving '${selectedNode} with prover '${proverPick.label}'!`,
          cancellable: false
        },
        _progress => {
          return hetsInterface.prove(
            `data/${fileLoadedInPane}`,
            config.get("prover.commands", "auto/full-theories/full-signatures"),
            selectedNode,
            proverPick.detail,
            config.get("prover.timeout", 5)
          );
        }
      );

      proverOutputChannel.clear();

      if (typeof proveResponse === "string") {
        proverOutputChannel.append(proveResponse);
      } else {
        const proverOutput = proveResponse[0];
        proverOutputChannel.appendLine(
          `Prover output for node: ${proverOutput["node"]}`
        );
        proverOutput["goals"].forEach((goal: JSON, i: number) => {
          proverOutputChannel.appendLine(`==============================`);
          proverOutputChannel.appendLine(`========== Output ${i} ==========`);
          proverOutputChannel.appendLine(`==============================`);
          proverOutputChannel.appendLine(`Name:\t\t\t\t${goal["name"]}`);
          proverOutputChannel.appendLine(`Result:\t\t\t\t${goal["result"]}`);
          proverOutputChannel.appendLine(
            `Used Translation:\t${goal["used_translation"]}`
          );
          proverOutputChannel.appendLine("Prover Output:");
          proverOutputChannel.append(goal["prover_output"]);
        });
      }
      proverOutputChannel.show(true);
    }
  );

  let loadFileCommand = vscode.commands.registerCommand(
    "hets-ide.loadFile",
    async () => {
      fileLoadedInPane = null;
      clearSelectedNode();

      if (!panel) {
        createWebview(context);
      }

      let textEditor: vscode.TextEditor = null;
      if (vscode.window.visibleTextEditors.length > 1) {
        let textEditorPicks: vscode.QuickPickItem[] = [];
        vscode.window.visibleTextEditors.forEach(
          (editor: vscode.TextEditor) => {
            vscode.workspace.workspaceFolders.forEach(wsfolder => {
              const filepathWorkspace = editor.document.fileName.replace(
                wsfolder.uri.fsPath,
                ""
              );

              textEditorPicks.push({
                label: filepathWorkspace,
                detail: editor.document.fileName
              });
            });
          }
        );

        let selectedEditor = await vscode.window.showQuickPick(
          textEditorPicks,
          {
            canPickMany: false
          }
        );

        if (!selectedEditor) {
          return;
        }

        textEditor = vscode.window.visibleTextEditors.find(
          editor => editor.document.fileName === selectedEditor.detail
        );
      } else {
        textEditor = vscode.window.visibleTextEditors[0];
      }

      fileLoadedInPane = textEditor.document.fileName;
      vscode.workspace.workspaceFolders.forEach(wsfolder => {
        fileLoadedInPane = textEditor.document.fileName.replace(
          wsfolder.uri.fsPath,
          ""
        );
      });

      panel.title = `Development Graph - ${fileLoadedInPane}`;

      const config = vscode.workspace.getConfiguration("hets-ide");

      const hetsInterface = new HetsRESTInterface(
        config.get("server.hostname", "localhost"),
        config.get("server.port", 8000)
      );

      const graph = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: `Fetching graph for '${fileLoadedInPane}'!`,
          cancellable: false
        },
        _progress => {
          return hetsInterface.getDecisionGraph(
            `data/${fileLoadedInPane}`,
            config.get("prover.commands", "auto/full-theories/full-signatures")
          );
        }
      );

      panel.webview.postMessage({ graph: graph });
    }
  );

  context.subscriptions.push(proveCommand);
  context.subscriptions.push(loadFileCommand);
}

export function deactivate() {}
