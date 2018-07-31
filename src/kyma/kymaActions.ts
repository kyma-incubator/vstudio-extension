import { execSync } from "child_process";
import * as vscode from 'vscode';
import { Kubectl } from "../kubectl";
import * as kubectlUtils from './../kubectlUtils';
import * as explorer from '../explorer';
export async function createNewEnvironment() {

    const namespaceName = await vscode.window.showInputBox({ placeHolder: "Name of the Environment" });

    let envDoc = {
        apiVersion: "v1",
        kind: "Namespace",
        metadata: {
            labels: {
                env: "true",
            },
            name: "",
        }
    };

    envDoc.metadata.name = namespaceName;
    console.log(envDoc);
    const jsonString = JSON.stringify(envDoc);

    const result = execSync(`echo ${jsonString} | kubectl create -f -`).toString();

    console.log(result);
    vscode.window.showInformationMessage(result);
}

export async function deleteEnvironment(kubectl: Kubectl, explorerNode: explorer.KubernetesObject) {


    kubectl.invokeInNewTerminal(`delete namespace ${explorerNode.id}`, "kubectl");

}

export async function installKyma() {
    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Installing Kyma", cancellable: true }, (progress, token) => {
        token.onCancellationRequested(() => {
            console.log("Cancel installing Kyma");
        });

        progress.report({ increment: 0 });

        setTimeout(() => {
            progress.report({ increment: 40, message: "Installing Core" });
        }, 2000);

        return new Promise((resolve) => {
            resolve();
        });
    });
}

export async function addServiceInstance(kubectl: Kubectl) {
    const serviceName = await vscode.window.showQuickPick(["Redis", "MySQL"], { placeHolder: "Add to Env" });
    console.log(serviceName);
}


let currentPanel: vscode.WebviewPanel | undefined = undefined;
export async function visualize(kubectl: Kubectl) {

    const columntoShow = vscode.window.activeTextEditor ? vscode.ViewColumn.Two : undefined;

    if (currentPanel) {
        currentPanel.reveal(columntoShow);
    } else {
        currentPanel = vscode.window.createWebviewPanel("visWebView",
            "Kyma Vis.",
            vscode.ViewColumn.Two, { enableScripts: true });


        const currentNamespace = await kubectlUtils.currentNamespace(kubectl);
        currentPanel.webview.html = getWebViewContent(currentNamespace);

        currentPanel.onDidDispose(() => {
            currentPanel = undefined;
        });

    }


}



function getWebViewContent(cn) {
    return `<!DOCTYPE html>
    <meta charset="utf-8">
    <body>
    <script src="//d3js.org/d3.v4.min.js"></script>
    <script src="https://unpkg.com/viz.js@1.8.0/viz.js" type="javascript/worker"></script>
    <script src="https://unpkg.com/d3-graphviz@1.4.0/build/d3-graphviz.min.js"></script>
    <div id="graph" style="text-align: center;"></div>
    <script>
    d3.select("#graph").graphviz()
        .fade(false)
        .renderDot('digraph  {a -> b}');
    </script>`;
}