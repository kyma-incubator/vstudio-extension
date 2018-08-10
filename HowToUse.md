# Kyma VSCode Plugin

## Installation
---
- Clone the Github repository. 
- `npm install`
- either use visual studio extension manager `npm install -g vsce` and `vsce package` to create a **.vsix** package or click F5 to run the extension on *extension development host.* 
- **You can also download the vsix file directly from Github releases.**

## Configuration
---
Additional to kubernetes extension's own configuration settings, this extension only ask for a port to serve to schema validator file. This port is default to *4402*. 

- Most important configuration is the kubeconfig file that is used to connect to Kyma instance. **Provide an absolute path for it.**

## Functionality
---
### Kyma Explorer
 This plugin adds a new explorer view to Activity bar. It has the kyma logo and on click it connect to kyma instance. It show the kyma deployments in a tree view. This tree view shows kubernetes resources as well as custom defined resources.
 
 - Right Clicking on a namespace and selecting `Set as current namespace` changes the current active namespace.
 - Clicking on resources open their deployment yaml files. Very useful for inspecting. 
 - This yaml files can be edited on the fly and re-deployed.

 ### Commands
 Kyma commands use the command namespace `kyma`. Writing `kyma` to command pallette brings up all Kyma related commands.

 - `Add New Environment` : Adds a new environment (namespace) to kyma instance. In a new deployment, Kyma has *qa* , *production* , *stage* environments out of the box.
 -  `Delete Environment`: Deletes the selected environment with all it's deployments.
 - `Open Console`: Open *console.kyma.local ` in local web browser.
- `Deploy to Kyma`: If selected file is a `javascript` file, it tries to deploy it as a lambda to Kyma. It creates a `deployment.yaml` file with default settings and uses javascript file's name as identifier. Deployment it done to currently active namespace (Which can be seen from Kyma View). If the file is a yaml file, it creates an extra yaml file with the same content in `temp` folder and deploys it. The reason for creating temp files is the ability to re-deploy configuration files that can be seen from the kyma View. 
- `Expose Lambda`: Creates a default Api configuration for the lambda function and deploys it.
- `Debug Lambda`: Debugs the lambda function. If opened file is a javascript file, it takes the filename as the function name. If it's a yaml file, it takes name in metadata config. If none of the above, it asks the Kyma instance for function names and calls the one selected.  

   Once a function is selected ,it sends a request to function using `kubeless`. If kubeless command exits normally, the output of the function is shown in OUTPUT channel named kyma lambda. If kubeless functions exits with an error code, that means there is an error in the function and thus closer inspection begin. The last 10 seconds of the logs of the function that runs the lambda function is taken , words `failed` and `error` searched in the logs. If found, extension tries to parse the text for relevant line information. It is also shown in the PROBLEMS tab with the relevant error message. Most of this process is manual , so debugging couple of times might help identifying errors better. 

### Scheme Validation
This extension provides schema validation and hover support for multiple yaml files. If the yaml version has a key named `ApiVersion` this info is parsed and according to yaml version a validation scheme is called. Supported versions are:
 - gateway.kyma.cx/v1alpha2
 - kubeless.io/v1beta1
 - servicecatalog.kyma.cx/v1alpha1
 - remoteenvironment.kyma.cx/v1apha1

 Another hover support is, if you are in a yaml file except kubeless, when you hover to function key, you will see currently deployed lambda function. This functionality is useful if you want to deploy an API for a function and want to get the function name easily just by hovering.

  ## Dependencies
This extension needs both `kubeless` and `kubectl` in the path. This program relies on a fixed `kubeless` issue, so you may need to change the executable. For more info see this [github issue](https://github.com/kubeless/kubeless/issues/874#event-1769345570).
 