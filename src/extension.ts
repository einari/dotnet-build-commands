import * as vscode from 'vscode';
import { Project, ProjectPicker } from './ProjectPicker';
import { PickProjectArgs } from './PickProjectArgs';
import { interpolateVariables } from './interpolateVariables';
import { LaunchContext } from './LaunchContext';

async function selectProject(outputChannel: vscode.OutputChannel, args: PickProjectArgs, context: vscode.ExtensionContext, launchContext: LaunchContext) {
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

export function activate(context: vscode.ExtensionContext) {
	const logger = vscode.window.createOutputChannel('.NET Build Commands');
	const launchContext = new LaunchContext(context);

	vscode.debug.onDidTerminateDebugSession(() => {
		launchContext.clear();
	});

	context.subscriptions.push(vscode.commands.registerCommand('dotnet-build-commands.selectProject', async (args: PickProjectArgs) => {
		if (launchContext.isInContext()) {
			const project = context.workspaceState.get('selectedProject') as Project;
			return project.path;
		}
		return await selectProject(logger, args, context, launchContext);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('dotnet-build-commands.selectProjectForLaunch', async (args: PickProjectArgs) => {
		launchContext.set();
		return await selectProject(logger, args, context, launchContext);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('dotnet-build-commands.selectedProject', async () => {
		const project = context.workspaceState.get('selectedProject') as Project;
		return project?.path;
	}));

	context.subscriptions.push(vscode.commands.registerCommand('dotnet-build-commands.getTarget', async () => {
		const project = context.workspaceState.get('selectedProject') as Project;
		return project?.outputPath;
	}));
}

export function deactivate() { }
