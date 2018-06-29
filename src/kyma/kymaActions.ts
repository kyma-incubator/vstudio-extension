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


