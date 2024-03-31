import * as vscode from 'vscode';
import { Project } from './ProjectPicker';
import { PickProjectArgs } from './PickProjectArgs';
import { LaunchContext } from './LaunchContext';
import { buildFromContext } from './buildFromContext';
import { selectProject } from './selectProject';

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

	context.subscriptions.push(vscode.commands.registerCommand('dotnet-build-commands.buildFromContext', async () => {
		await buildFromContext();
	}));
}

export function deactivate() { }
