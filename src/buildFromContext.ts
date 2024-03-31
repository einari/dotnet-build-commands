import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';

function replaceVariables(input: any, inputs: string[], replaceString: string) {
    for (const propertyName of Object.keys(input)) {
        const property = input[propertyName];

        if (typeof property === 'string') {
            input[propertyName] = replaceVariableInString(property, inputs, replaceString);
        } else if (Array.isArray(property)) {
            for (let i = 0; i < property.length; i++) {
                if (typeof property[i] === 'string') {
                    property[i] = replaceVariableInString(property[i], inputs, replaceString);
                }
            }
        } else if (typeof property === 'object') {
            replaceVariables(property, inputs, replaceString);
        }
    }
}

function findNearestCsprojFile(fileUriPath: string) {
    let currentPath = fileUriPath;
    let csprojPath = '';

    while (currentPath !== path.delimiter) {
        const files = fs.readdirSync(currentPath);
        const csprojFiles = files.filter(file => file.endsWith('.csproj'));

        if (csprojFiles.length > 0) {
            csprojPath = path.join(currentPath, csprojFiles[0]);
            break;
        }

        currentPath = path.dirname(currentPath);
    }

    if (csprojPath === '') {
        return undefined;
    }

    return currentPath;
}

function replaceVariableInString(value: string, inputs: string[], replaceString: string) {
    for (const input of inputs) {
        value = value.replace(input, replaceString);
    }
    return value;
}

export async function buildFromContext() {
    const workspaceEnumAsString = vscode.TaskScope[vscode.TaskScope.Workspace];
    const allTasks = await vscode.tasks.fetchTasks();
    const tasks = allTasks.filter(t => (t.source as any) === workspaceEnumAsString);

    const t = tasks[0];

    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    if (tasks.length === 0) {
        vscode.window.showErrorMessage('No build tasks found.');
        return;
    }

    let task: vscode.Task | undefined;
    if (tasks.length === 1) {
        task = tasks[0];
    } else {
        task = tasks.find(t => t.group?.isDefault);

        if (!task) {
            vscode.window.showErrorMessage('Ambiguous build tasks. Please make one of the tasks a default task.');
            return;
        }
    }

    vscode.workspace.saveAll();

    const fileUri = editor.document.uri;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
    if (!workspaceFolder) {
        vscode.window.showErrorMessage(`Unable to resolve workspace for ${fileUri.fsPath}.`);
        return;
    }

    const fileDirectory = path.dirname(fileUri.fsPath);
    const csProjPath = findNearestCsprojFile(fileDirectory);
    if (!csProjPath) {
        vscode.window.showErrorMessage('No .csproj file found in the hierarchy');
        return;
    }

    const tasksJsonFile = path.join(workspaceFolder.uri.fsPath, '.vscode', 'tasks.json');
    const tasksJson = JSON.parse(fs.readFileSync(tasksJsonFile, 'utf8'));
    const inputs = tasksJson.inputs?.filter((input: any) => input.command === 'dotnet-build-commands.selectProject') || [];

    if (inputs.length === 0) {
        vscode.window.showErrorMessage('No input found that leverages the selectProject command, which means it is not possible to augment a build task for building from context.');
        return;
    }

    const inputStrings = inputs.map((input: any) => '${input:' + input.id + '}');
    replaceVariables(task, inputStrings, csProjPath);
    task = new vscode.Task(task.definition, task.scope!, task.name, task.source, task.execution, task.problemMatchers);
    await vscode.tasks.executeTask(task);
}