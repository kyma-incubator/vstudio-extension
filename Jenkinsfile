#!/usr/bin/env groovy
def label = "kyma-${UUID.randomUUID().toString()}"
def application = 'vscode-plugin'
dockerRegistry = 'eu.gcr.io/kyma-project/'
def dockerCredentials = 'gcr-rw'
def isMaster = env.BRANCH_NAME == 'master'
def appVersion = env.TAG_NAME?env.TAG_NAME:"develop-${env.BRANCH_NAME}"

echo """
********************************
Job started with the following parameters:
BRANCH_NAME=${env.BRANCH_NAME}
TAG_NAME=${env.TAG_NAME}
********************************
"""

podTemplate(label: label) {
    node(label) {
        try {
            timestamps {
                timeout(time:20, unit:"MINUTES") {
                    ansiColor('xterm') {
                        stage("setup") {
                            checkout scm

                            withCredentials([usernamePassword(credentialsId: dockerCredentials, passwordVariable: 'pwd', usernameVariable: 'uname')]) {
                                sh "docker login -u $uname -p '$pwd' $dockerRegistry"
                            }

                            if (isMaster) {
                                ws() {
                                    scriptUrl = 'https://stash.hybris.com/scm/yaasp/pipeline-library.git'
                                    scan = loadModule url: scriptUrl, name: 'scan', branch: 'kyma'
                                }
                            }
                        }


                        stage("build $application") {
                            execute("build.sh")
                        }

                        stage("package $application") {
                            execute("vsce package")
                        }

                        if (isMaster) {
                            stage("IP scan $application (WhiteSource)") {
                                withCredentials([string(credentialsId: 'whitesource_apikey', variable: 'apikey')]) {
                                    execute("make scan", ["API_KEY=$apikey"])
                                }
                            }
                        }

                        if (isMaster) {
                            stage("security scan $application (Checkmarx)"){
                                scan.checkmarx(projectname: "KYMA_" + application.toUpperCase() + "_" + "MASTER", credentialsId: 'checkmarx' )
                            }
                        }

                        stage("archive $application") {
                            archiveArtifacts artifacts: '*.vsix', onlyIfSuccessful: true
                        }
                    }
                }
            }
        } catch (ex) {
            echo "Got exception: ${ex}"
            currentBuild.result = "FAILURE"
            def body = "${currentBuild.currentResult} ${env.JOB_NAME}${env.BUILD_DISPLAY_NAME}: on branch: ${params.GIT_BRANCH}. See details: ${env.BUILD_URL}"
            emailext body: body, recipientProviders: [[$class: 'DevelopersRecipientProvider'], [$class: 'CulpritsRecipientProvider'], [$class: 'RequesterRecipientProvider']], subject: "${currentBuild.currentResult}: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'"
        }
    }
}

def execute(command, envs = []) {
    def repositoryName = 'kyma-vscode-plugin'
    def buildpack = 'node-buildpack:0.0.8'
    def envText = ''
    for (it in envs) {
        envText = "$envText --env $it"
    }
    workDir = pwd()
    sh "docker run --rm -v $workDir:/$repositoryName -w /$repositoryName $envText ${dockerRegistry}$buildpack /bin/bash -c '$command'"
}