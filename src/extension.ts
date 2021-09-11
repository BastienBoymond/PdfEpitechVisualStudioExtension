
import * as vscode from 'vscode';
const axios = require('axios');
const intraApiEpi = require("epitech_intranet_api");

async function getPdf(autolog: string) {
	const intra = new intraApiEpi(autolog);
	let pdfList: any[] = [];
	const promises = [];

	const modules: any[] = await intra.module.getAllModules();
	for (const module of modules) {
		if (module.semester !== 0) {
			const promise = new Promise(async (resolve, reject) => {
				const projects = await intra.project.getProjectByModule(module.code);
				for (const project of projects) {
					const projetPromises = [];
					const projectPromise = new Promise(async (resolve, reject) => {
						const pdf = await intra.project.getProjectFile(module.code, project.title);
						pdfList.push({
							label: project.title,
							description: project.description,
							link: pdf[0]
						});
					resolve(null);
					});
					projetPromises.push(projectPromise);
					await Promise.all(projetPromises);
				}
				resolve(null);
			});
			promises.push(promise);
		}
	}
	await Promise.all(promises);
	
	console.log(pdfList);
	return pdfList;
}

async function getAutologInSecrets(secrets: any){
	return await secrets.get("autolog");
	
}

export async function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "epitechpdf" is now active!');
	const secrets = context['secrets'];
	let autolog: string = await getAutologInSecrets(secrets);
	console.log(autolog);
	let pdf: any;
	if (typeof autolog === 'undefined') {
		vscode.window.showInputBox({
			prompt: 'Enter your autologin',
			placeHolder: "Autologin",
		}).then(value => {
			if (value) {
				value = value.replace('https://intra.epitech.eu/', '');
				console.log(value);
				axios.get(`https://intra.epitech.eu/${value}/?format=json`).then(() => {
					autolog = value!;
					vscode.window.showInformationMessage('Autologin set');
					secrets.store("autolog", autolog);
					pdf = getPdf(autolog);
				}).catch((e: any) => {
					vscode.window.showErrorMessage("Wrong autologin Retry log you with command EpitechPDFLogin");
				});
			}
		});
  	} else {
		  pdf = getPdf(autolog);
	  }

	let disposable = vscode.commands.registerCommand('epitechpdf.epitechPDF', async () => {
		if (pdf) {
			const seePDF:any = await vscode.window.showQuickPick(pdf, {matchOnDetail: true});
			if (seePDF) {
				vscode.env.openExternal(vscode.Uri.parse(seePDF.link));
			} 
		}
	});

	let login = vscode.commands.registerCommand('epitechpdf.epitechPDFLogin', () => {
		vscode.window.showInputBox({
			prompt: 'Enter your autologin',
			placeHolder: "Autologin",
		}).then(value => {
			if (value) {
				value = value.replace('https://intra.epitech.eu/', "");
				axios.get(`https://intra.epitech.eu/${value}/?format=json`).then(() => {
					autolog = value!;
					vscode.window.showInformationMessage('Autologin set');
					secrets.store("autolog", autolog);
					pdf = getPdf(autolog);
				}).catch((e: any) => {
					vscode.window.showErrorMessage("Wrong autologin Retry log you with command EpitechPDFLogin");
				});
			}
		});
	});


	context.subscriptions.push(disposable);
	context.subscriptions.push(login);
}

export function deactivate() { }