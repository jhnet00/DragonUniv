pipeline {
    agent any

    triggers {
        pollSCM('* * * * *')
    }

    stages {
        stage('Deploy') {
            steps {
                sh 'kubectl rollout restart deployment/frontend -n dragon-univ'
                sh 'kubectl rollout restart deployment/backend -n dragon-univ'
                sh 'kubectl rollout status deployment/frontend -n dragon-univ --timeout=120s'
                sh 'kubectl rollout status deployment/backend -n dragon-univ --timeout=120s'
            }
        }
    }

    post {
        success {
            echo 'Deployment successful'
        }
        failure {
            echo 'Deployment failed'
        }
    }
}
