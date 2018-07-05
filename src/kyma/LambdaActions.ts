import * as vscode from 'vscode';
import * as path from 'path';
import { execSync } from 'child_process';
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

    async deployToKyma(editor: vscode.TextEditor, kubectl: Kubectl) {

        console.log("running lambda to kyma");
        this.deployConf.spec.runtime = editor.document.languageId === "javascript" ? "nodejs8" : "any";

        this.deployConf.spec.function = editor.document.getText().replace(/(\r\n\t|\n|\r\t)/gm, "");

        this.deployConf.spec.deps = await this.lookForDeps();

        this.deployConf.metadata.name = path.basename(editor.document.uri.fsPath, path.extname(editor.document.uri.fsPath));

        console.log(this.deployConf);

        const workspacePath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "deployment.yaml"); //FIXME: assumes only one workspace is opened.
        fs.writeFileSync(workspacePath, yaml.safeDump(this.deployConf), { encoding: "utf8", flag: "w" });

        const namespace = await currentNamespace(kubectl);


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

