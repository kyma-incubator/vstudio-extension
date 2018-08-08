pipeline {
  agent {
    docker {
      image 'node:alpine'
    }

  }
  stages {
    stage('Build') {
      steps {
        sh '''npm install -g vsce
npm install -g typescript
npm install -g gulp
npm install
npm run postinstall'''
      }
    }
    stage('Package') {
      steps {
        sh 'vsce package'
      }
    }
  }
}
