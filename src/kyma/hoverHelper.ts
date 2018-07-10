import * as vscode from 'vscode';
import { Kubectl } from "../kubectl";
import * as kubectlUtils from "../kubectlUtils";
import * as yaml from "js-yaml";
/*
async function provideHoverYamlKyma(document: vscode.TextDocument, position: vscode.Position, token): Promise<vscode.Hover> {
    const line = document.lineAt(position.line);
    const ix = line.text.indexOf(":");
    const propertyName = line.text.substring(line.firstNonWhitespaceCharacterIndex, ix);
    console.log(propertyName);
    const KYMA_SCHEMA_FILE = path.join(__dirname, `../../../schema/kyma-hover.json`); //FIXME: make this a constant.
    let jsonFile: any;
    try {
        jsonFile = fs.readFileSync(KYMA_SCHEMA_FILE, "utf8");
    } catch (err) {
        console.error(err);
    }
    jsonFile = JSON.parse(jsonFile);
    let msg: string;

    if (propertyName == "function") {
        const parentLinePos = findParentYaml(document, position.line);
        const parentLine = document.lineAt(parentLinePos);

        const pix = parentLine.text.indexOf(":");

        const parentPropertyName = parentLine.text.substring(parentLine.firstNonWhitespaceCharacterIndex, pix);
        if (parentPropertyName == "metadata") {
            console.log("Checking that function");
            msg = "Your Functions\n";

            const functions = await kubectlUtils.getDataHolders("configmaps", kubectl);
            functions.forEach((cm) => { msg += cm.metadata.name + "\n"; });


            return new vscode.Hover(msg);
        }

        console.log(parentPropertyName);
        // const parentProperty = document.lineAt(parent).text.indexOf(":");
        if (!jsonFile[parentPropertyName][propertyName]) {
            msg = "Unknown Field";
        } else {
            msg = jsonFile[parentPropertyName][propertyName];
        }

    } else {
        if (!jsonFile[propertyName]) {
            msg = jsonFile[propertyName]["description"] ? jsonFile[propertyName]["description"] : "Unknown Field";
            msg = "Unknown Field";
        } else {
            msg = jsonFile[propertyName]["description"] ? jsonFile[propertyName]["description"] : jsonFile[propertyName];

        }
    }


    /* return new Promise(async (resolve) => {
         resolve(new vscode.Hover(msg));
     });
    return new vscode.Hover(msg);
}*/
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