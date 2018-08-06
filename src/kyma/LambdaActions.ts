import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { currentNamespace } from '../kubectlUtils';
import { Kubectl } from '../kubectl';
import { shell } from '../shell';
import * as tmp from "tmp";
export class LambdaActions {

    constructor(private readonly kubectl: Kubectl) { }
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
    private output = vscode.window.createOutputChannel("kyma lambda");
    private dc = vscode.languages.createDiagnosticCollection();
    async deployToKyma(editor: vscode.TextEditor, kubectl: Kubectl) {

        console.log("deploying lambda to kyma");
        if (editor.document.languageId === "javascript") {
            this.deployConf.spec.runtime = "nodejs8";




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
            await kubectl.invokeInSharedTerminal(`apply -f ${workspacePath} -n ${namespace}`);
        }
        else if (editor.document.languageId === "yaml") {
            // kubectl.invokeInSharedTerminal(`apply -f ${editor.document.uri}`);
            const yamlText = editor.document.getText();
            console.log(yamlText);
            let tmpFile = tmp.fileSync({ mode: 644, prefix: "lambdaDeploy-", postfix: ".yaml" });
            console.log(tmpFile.name);
            console.log(tmpFile.fd);
            fs.writeFileSync(tmpFile.name, editor.document.getText());
            await kubectl.invokeInSharedTerminal(`apply -f ${tmpFile.name}`);

        }


    }

    async exposeLambda(kubectl: Kubectl) {
        console.log("Exposing lambda");

        this.apiConf.metadata.labels.function = this.deployConf.metadata.name;
        this.apiConf.metadata.name = this.deployConf.metadata.name;
        this.apiConf.spec.hostname = this.deployConf.metadata.name + ".kyma.local";
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



    async debugLambda(editor: vscode.TextEditor) {

        let functionName = "";
        if (editor.document.languageId === "javascript") {
            functionName = path.basename(editor.document.uri.fsPath, path.extname(editor.document.uri.fsPath));

        }
        else if (editor.document.languageId === "yaml") {
            console.log(yaml.safeLoad(editor.document.getText()));
            functionName = yaml.safeLoad(editor.document.getText()).metadata.name;

            console.log(functionName);
        }
        else {

            const fn = await this.getKubelessFunctions();

            functionName = await vscode.window.showQuickPick(fn.map((f) => f.metadata.name));
            if (functionName === undefined) {
                console.log("No function selected...");
                return;
            }
            console.log(`selected func -> ${functionName}`);


        }

        vscode.window.showInformationMessage("Running the debug command");
        shell.exec("kubeless function call " + functionName).then(({ code, stdout, stderr }
        ) => {
            this.output.clear();
            if (code == 1) { //means exited with error
                //get logs and find error
                this.output.appendLine(stderr);
                this.kubectl.invoke("get " + "pod", (code, stdout, stderr) => {
                    if (code !== 0) {
                        vscode.window.showErrorMessage(stderr);
                        return;
                    }
                    let names = this.parseNamesFromKubectlLines(stdout);
                    if (names.length === 0) {
                        vscode.window.showInformationMessage("No resources of type " + "pod" + " in cluster");
                        return;
                    } else {
                        console.log(names);
                        const podName = names.filter((podName) => podName.includes(functionName));
                        let cmd = 'logs ' + podName;


                        cmd += ' --container=' + functionName;
                        cmd += " --since=10s";

                        this.kubectl.invoke(cmd, (code, stdout, stderr) => {


                            let errorPos = stdout.search(/failed/gi);
                            if (errorPos == -1) {
                                errorPos = stdout.search(/Error/gi);
                                const errorString = stdout.substring(errorPos);

                                this.output.appendLine(errorString);
                                this.output.show();

                            } else {
                                const errorString = stdout.substring(errorPos);

                                this.output.appendLine(errorString);
                                this.output.show();
                                this.parseErrorOutput(editor, errorString);
                            }





                        });

                    }
                });
            }
            else {
                //show function output

                this.output.appendLine(stdout);
                this.output.show();
            }

        });


    }





    private parseErrorOutput(editor: vscode.TextEditor, error: String) {
        const byLine = error.split("\n");
        const fileLine = byLine[1];
        const explain = byLine[0].substring(byLine[0].indexOf(":") + 2);
        console.log(explain);
        const lineNumberStart = fileLine.indexOf(":") + 1;
        console.log(lineNumberStart);
        const lineNumberEnd = fileLine.lastIndexOf(":");
        console.log(lineNumberEnd);

        let lineNumber = +fileLine.substring(+lineNumberStart, +lineNumberEnd); //+ casts string to int
        console.log(lineNumber);

        console.log(fileLine + " --> " + lineNumber);
        let diagnostics: vscode.Diagnostic[] = [];

        let severity = vscode.DiagnosticSeverity.Error;
        if (editor.document.languageId == "yaml") {
            for (let i = 0; i < editor.document.lineCount; i++) {
                if (editor.document.lineAt(i).text.includes("function")) {
                    lineNumber = i + 1 + lineNumber;
                    console.log("i:" + i);
                    console.log("ln:" + lineNumber);
                    break; //first function is enough for us
                }
            }
        }
        let range = new vscode.Range(lineNumber - 1, +fileLine.substring(lineNumberEnd), lineNumber - 1, 20); //20 is just a constant

        let diagnostic = new vscode.Diagnostic(range, explain, severity);
        diagnostics.push(diagnostic);


        this.dc.clear();
        this.dc.delete(editor.document.uri);
        this.dc.set(editor.document.uri, diagnostics);


    }


    private parseNamesFromKubectlLines(text) {
        let lines = text.split('\n');
        lines.shift();

        let names = lines.filter((line) => {
            return (line.length > 0) && line.includes("Running");
        }).map((line) => {
            return line.split(' ')[0];
        });

        return names;
    }

    private async getKubelessFunctions() {
        let functions: any;
        functions = await shell.exec('kubeless function ls -o json').then(({ code, stdout, stderr }
        ) => {

            functions = JSON.parse(stdout);

            return functions;

        });
        console.log(`in func:`);
        console.log(functions);
        return functions;
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

