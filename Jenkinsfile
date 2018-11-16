#!/usr/bin/env groovy
def label = "kyma-${UUID.randomUUID().toString()}"
application = 'vstudio-extension'
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

                        }
                         stage("build $application") {
                            execute("npm install")
                            execute("npm install -g typescript gulp && npm run postinstall")
                        }
                         stage("package $application") {
                            execute("npm install -g vsce && vsce package")
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
    def buildpack = 'node-buildpack:0.0.8'
    def envText = ''
    for (it in envs) {
        envText = "$envText --env $it"
    }
    workDir = pwd()
    sh "docker run --rm -v $workDir:/$application -w /$application $envText ${dockerRegistry}$buildpack /bin/bash -c '$command'"
}
