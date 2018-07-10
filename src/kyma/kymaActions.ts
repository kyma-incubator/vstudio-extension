import { execSync } from "child_process";
import * as vscode from 'vscode';
import { Kubectl } from "../kubectl";
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