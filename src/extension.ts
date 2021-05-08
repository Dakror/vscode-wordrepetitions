// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let diag = vscode.languages.createDiagnosticCollection("wordrepeats");

    vscode.commands.registerTextEditorCommand("wordrepeats.clearRepetitions", async () => {
        diag.clear();
    });

    vscode.commands.registerTextEditorCommand("wordrepeats.findRepetitions", async () => {
        const editor = vscode.window.activeTextEditor;
        const config = vscode.workspace.getConfiguration("wordrepeats");
        if (editor) {
            const minDistance: number = config.get("minDistance")!;
            const excluded: string = config.get("excludedWords")!;
            const excludedList = excluded.split(",").map((x) => x.toLowerCase());
            const words = editor.document.getText().split(/\s/);
            let map = new Map<string, number>();
            let ctr = 0;
            let pos = 0;
            let regex = new RegExp(/(\p{L}+)/u);
            let diags: vscode.Diagnostic[] = [];
            for (let token of words) {
                const match = token.match(regex);
                if (match) {
                    const word = match[1].toLowerCase();
                    if (!excludedList.includes(word)) {
                        let val = map.get(word);
                        if (val !== undefined && ctr - val < minDistance) {
                            // add squiggle
                            diags.push(
                                new vscode.Diagnostic(
                                    new vscode.Range(
                                        editor.document.positionAt(pos),
                                        editor.document.positionAt(pos + word.length)
                                    ),
                                    `Duplicate word within min distance (${
                                        ctr - val + 1
                                    } words ago)`,
                                    vscode.DiagnosticSeverity.Information
                                )
                            );
                        }
                        val = ctr;
                        map.set(word, val);
                    }

                    ctr++;
                }

                pos += token.length + 1;
            }

            diag.set(editor.document.uri, diags);
        }
    });
}

// this method is called when your extension is deactivated
export function deactivate() {}
