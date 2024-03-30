import * as vscode from 'vscode';
import fs from 'fs';
import { interpolateVariables } from './interpolateVariables';
import { LaunchContext } from './LaunchContext';

export type Project = {
    name: string;
    path: string;
    outputPath?: string;
};

export class ProjectPicker {
    constructor(
        readonly _logger: vscode.OutputChannel, 
        readonly _launchContext: LaunchContext) {
    }

    async pick(file: string): Promise<Project | undefined> {
        try {
            const data = await fs.promises.readFile(file, 'utf-8');
            let projects = JSON.parse(data) as Project[];
            projects = projects.map(_ => {
                return {
                    name: _.name,
                    path: interpolateVariables(_.path),
                    outputPath: interpolateVariables(_.outputPath)
                } as Project;
            });

            if( this._launchContext.isInContext() ) {
                projects = projects.filter(_ => _.outputPath !== undefined);
            }

            const items = projects.map<vscode.QuickPickItem>(_ => {
                return {
                    label: _.name,
                };
            });

            const result = await vscode.window.showQuickPick(items, {
                title: 'Select project',
            });
            
            return projects.find(_ => _.name === result?.label);
        } catch (error) {
            this._logger.appendLine(`Error reading file: ${file} - ${error}`);
        }
    }
}