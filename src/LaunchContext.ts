import * as vscode from 'vscode';

export const LAUNCH_CONTEXT_KEY = 'launchContext';

export class LaunchContext {
	constructor(readonly _context: vscode.ExtensionContext) { }

	clear() {
		this._context.workspaceState.update(LAUNCH_CONTEXT_KEY, false);
	}

	set() {
		this._context.workspaceState.update(LAUNCH_CONTEXT_KEY, true);
	}

	isInContext(): boolean {
		return this._context.workspaceState.get(LAUNCH_CONTEXT_KEY) === true;
	}
}
