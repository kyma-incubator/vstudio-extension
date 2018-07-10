import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { currentNamespace } from '../kubectlUtils';
import { Kubectl } from '../kubectl';
export class LambdaActions {
    private deployConf = {
        apiVersion: "kubeless.io/v1beta1",
        kind: "Function",
        metadata: {
            name: "",
            labels: {
                deployedBy: "vscode",
            },
        },
        spec: {
            deps: "",
            function: "",
            runtime: "",
            type: "HTTP",
            handler: "handler.main" //TODO: do we want to change this.
        },

    };
    private apiConf = {
        apiVersion: "gateway.kyma.cx/v1alpha2",
        kind: "Api",
        metadata: {


            labels: {
                deployedBy: "vscode",
                function: "",
            },
            name: "",

        },
        spec: {
            hostname: "",
            service: {
                name: "",
                port: 8080,
            }
        },
    };
    async deployToKyma(editor: vscode.TextEditor, kubectl: Kubectl) {

        console.log("running lambda to kyma");
        this.deployConf.spec.runtime = editor.document.languageId === "javascript" ? "nodejs8" : "any";

        if (this.deployConf.spec.runtime === "any") {
            vscode.window.showErrorMessage("Not a javascript file, Aborting...");
            return;
        }

        this.deployConf.spec.function = editor.document.getText().replace(/(\r\n\t|\n|\r\t)/gm, "");

        this.deployConf.spec.deps = await this.lookForDeps();

        this.deployConf.metadata.name = path.basename(editor.document.uri.fsPath, path.extname(editor.document.uri.fsPath));

        console.log(this.deployConf);

        const workspacePath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "deployment.yaml"); //FIXME: assumes only one workspace is opened.
        fs.writeFileSync(workspacePath, yaml.safeDump(this.deployConf), { encoding: "utf8", flag: "w" });

        const namespace = await currentNamespace(kubectl);

        if (namespace === "default") {
            vscode.window.showWarningMessage("You can't deploy to default, select a Kyma environment.");
            return;
        }
        await kubectl.invokeInNewTerminal(`apply -f ${workspacePath} -n ${namespace}`, "kubectl");



    }

    async exposeLambda(kubectl: Kubectl) {
        console.log("Exposing lambda");

        this.apiConf.metadata.labels.function = this.deployConf.metadata.name;
        this.apiConf.metadata.name = this.deployConf.metadata.name;
        this.apiConf.spec.hostname = this.deployConf.metadata.name + ".yfactory.sap.corp";
        this.apiConf.spec.service.name = this.deployConf.metadata.name;

        const workspacePath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "api-without-auth.yaml");
        fs.writeFileSync(workspacePath, yaml.safeDump(this.apiConf), { encoding: "utf8", flag: "w" });

        const namespace = await currentNamespace(kubectl);
        if (namespace == "default") {
            vscode.window.showWarningMessage("You can't deploy to default, select a kyma environment");
            return;
        }
        await kubectl.invokeInNewTerminal(`apply -f ${workspacePath} -n ${namespace}`, "kubectl");

    }
    private async lookForDeps() {
        return ""; //FIXME: remove this line   !!!!!!! HOW DO WE GET DEPS ?????
        /*const jsonFile = await vscode.workspace.findFiles("package.json");
        if (!jsonFile || jsonFile.length === 0) {
            return "";
        }
        return "package.json";*/
    }



}

/*
apiVersion: kubeless.io/v1beta1
kind: Function
metadata:
  name: hello
  labels:
    example: serverless-lambda
spec:
  deps: ""
  function: |-
    module.exports = {
        main: function (event, context) {
            return 'hello world';
        }
    }
  runtime: nodejs8
  type: HTTP
  handler: handler.main
*/

