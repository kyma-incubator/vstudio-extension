# Kyma VS Code Plugin

## Installing
- Download the released .vsix file. 
- Go to extension in VS Code , click 3 dots and select install from vsix.
- Select the file.
- Reload.

## Developing
- Clone this repo.
- `npm install` inside folder.
- Make sure you have `kubectl` in your path.
- Open the folder in VS Code. VS Code automatically detects it as a plugin.
- To run it, click `F5` or `Fn+F5`
- It will open a new VS code instance with the title `Extension Development host`, where the plugin will be installed.

- This plugin is currently using the same namespace with `vscode-kubernetes` plugin, so it will overwrite it. You will get a warning of it , if kubernetes plugin is installed.

## Roadmap

- [x] Kyma Logo  
- [x] See Kyma Resources
    - [x] Lambdas
    - [x] Apis
    - [x] Deployments
    - [x] Services
    - [x] Remote Environments
- [x] Hovering to function keyword reveals currently running functions.
- [x] Learn about Kyma Deployment files
- [x] Provide schema validation for Kyma deployment files
    - [ ] Add configuration option to change default port 
- [x] Snippets
    - [x] Lambda
    - [x] Api
    - [x] Deployment
- [x] Deploy to Kyma functionality
    - [x] Deploy 
    - [x] Expose
- [ ] Install Kyma
- [ ] Add Service Instance
    - [ ] Redis

---
### Known Problems
- Fix logo in extension preview page.
- Currently Kyma does not identify "Api" as a resource. This is probably due to a bug 10.07.2018 built.

### Caveats
- This extension creates a server that listens on port 4444. If you want to use that port number, change it in settings.