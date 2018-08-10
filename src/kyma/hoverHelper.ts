import * as vscode from 'vscode';
import { Kubectl } from "../kubectl";
import * as kubectlUtils from "../kubectlUtils";
import * as yaml from "js-yaml";

export function MyHover(kubectl: Kubectl) {

    vscode.languages.registerHoverProvider(
        { language: 'yaml', scheme: 'file' },
        {
            async provideHover(document, position, token) {

                const docObj = yaml.safeLoad(document.getText());
                console.log(docObj);
                if (docObj["apiVersion"] == "kubeless.io/v1beta1") return;
                let msg: string;
                const line = document.lineAt(position.line);
                const ix = line.text.indexOf(":");
                const propertyName = line.text.substring(line.firstNonWhitespaceCharacterIndex, ix);
                console.log(propertyName);
                if (propertyName == "function") {
                    msg = "**Your functions:** \n\n";
                    const functions = await kubectlUtils.getDataHolders("configmaps", kubectl);
                    functions.forEach((cm) => {
                        msg += cm.metadata.name + "\n\n";
                    });

                    return new vscode.Hover(msg);
                }

            }
        }
    );
}
function findParentYaml(document, line): vscode.Position {
    let indent = yamlIndentLevel(document.lineAt(line).text);
    while (line >= 0) {
        let txt = document.lineAt(line);
        if (yamlIndentLevel(txt.text) < indent) {
            return line;
        }
        line = line - 1;
    }
    return line;
}

function yamlIndentLevel(str) {
    let i = 0;

    //eslint-disable-next-line no-constant-condition
    while (true) {
        if (str.length <= i || !isYamlIndentChar(str.charAt(i))) {
            return i;
        }
        ++i;
    }
}

function isYamlIndentChar(ch) {
    return ch === ' ' || ch === '-';
}