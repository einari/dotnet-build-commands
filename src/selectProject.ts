import * as vscode from 'vscode';
import { ProjectPicker } from './ProjectPicker';
import { PickProjectArgs } from './PickProjectArgs';
import { interpolateVariables } from './interpolateVariables';
import { LaunchContext } from './LaunchContext';

export async function selectProject(outputChannel: vscode.OutputChannel, args: PickProjectArgs, context: vscode.ExtensionContext, launchContext: LaunchContext) {
	const picker = new ProjectPicker(outputChannel, launchContext);

	if (!args.file) {
		vscode.window.showErrorMessage('Missing file argument');
		return;
	}

	const file = interpolateVariables(args.file)!;
	const result = await picker.pick(file);

	if (!result) {
		vscode.window.showErrorMessage('No project selected');
		launchContext.clear();
		return;
	}

	context.workspaceState.update('selectedProject', result);
	return result?.path;
}
