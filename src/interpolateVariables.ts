import * as vscode from 'vscode';

function getValueFrom(config: any, propertyToFind: string): any {
	for (const property in Object.keys(config)) {
		if (property === propertyToFind) {
			return config[property];
		}

		if (typeof config[property] === 'object') {
			const value = getValueFrom(config[property], propertyToFind);
			if (value) {
				return value;
			}
		}
	}

	return undefined;
}

export function interpolateVariables(input?: string): string | undefined {
	if (!input) {
		return input;
	}

	const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';

	return input.replace(/\$\{(.*?)\}/g, (_, varName) => {
		if (varName === 'workspaceFolder') {
			return workspaceFolder;
		}

		const config = vscode.workspace.getConfiguration();
		const value = getValueFrom(config, varName);
		return value || '';
	});
}
