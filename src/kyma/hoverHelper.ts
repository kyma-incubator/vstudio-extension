import * as vscode from 'vscode';
import * as path from 'path';
import { fs } from '../fs';

export function provideHoverYamlKyma(document: vscode.TextDocument, position: vscode.Position, token): Promise<vscode.Hover> {
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

    if (propertyName == "name") {
        const parentLinePos = findParentYaml(document, position.line);
        const parentLine = document.lineAt(parentLinePos);

        const pix = parentLine.text.indexOf(":");

        const parentPropertyName = parentLine.text.substring(parentLine.firstNonWhitespaceCharacterIndex, pix);
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


    return new Promise(async (resolve) => {
        resolve(new vscode.Hover(msg));
    });
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