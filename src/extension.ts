import * as vscode from "vscode";

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

      console.log(selectedNode);

      const config = vscode.workspace.getConfiguration("hets-ide");
      const hetsInterface = new HetsRESTInterface(
        config.get("server.hostname", "localhost"),
        config.get("server.port", 8000)
      );

      const comorphisms = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: `Fetching available comorphisms for node '${selectedNode}'!`,
          cancellable: false
        },
        _progress => {
          return hetsInterface.getComorphisms(
            `data/${fileLoadedInPane}`,
            selectedNode,
            null
          );
        }
      );

      console.log(comorphisms);

      let comorphPicks: vscode.QuickPickItem[] = [];
      comorphisms["translations"].forEach(trans => {
        comorphPicks.push({
          label: trans
        });
      });

      const comorphPick = await vscode.window.showQuickPick(comorphPicks, {
        canPickMany: false
      });

      if (!comorphPick) {
        return;
      }

      console.log(comorphPick);

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
            selectedNode,
            comorphPick.label
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
          title: `Proving '${selectedNode} with prover '${proverPick.label}' using '${comorphPick.label}'!`,
          cancellable: false
        },
        _progress => {
          return hetsInterface.prove(
            `data/${fileLoadedInPane}`,
            config.get("prover.commands"),
            selectedNode,
            proverPick.detail,
            config.get("prover.timeout"),
            comorphPick.label
          );
        }
      );

      proverOutputChannel.clear();

      console.log(proveResponse);

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

      fileLoadedInPane = fileLoadedInPane.replace(/\\/g, "/");

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
  vscode.tasks.registerTaskProvider(
    "hets-server",
    new HetsServerTaskProvider()
  );
}

class HetsServerTaskProvider implements vscode.TaskProvider {
  provideTasks(): vscode.ProviderResult<vscode.Task[]> {
    const folder = vscode.workspace.workspaceFolders[0];
    const config = vscode.workspace.getConfiguration("hets-ide");
    return [
      new vscode.Task(
        { type: "hets-server" },
        vscode.TaskScope.Workspace,
        "Start server",
        "Hets",
        new vscode.ShellExecution(
          `docker run --rm --name hets --mount type=bind,source="${
            folder.uri.fsPath
          }",target=/data,readonly -p 8000:8000 -ti ${config.get(
            "server.container-name"
          )}`
        )
      )
    ];
  }

  resolveTask(task: vscode.Task): vscode.ProviderResult<vscode.Task> {
    return task;
  }
}

export function deactivate() {}
