pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timeout(time: 15, unit: 'MINUTES')
        timestamps()
    }

    triggers {
        pollSCM('* * * * *')
    }

    environment {
        NAMESPACE = 'dragon-univ'
        FRONTEND_DEPLOYMENT = 'frontend'
        BACKEND_DEPLOYMENT = 'backend'
        IMAGE_PUBLISH_WAIT_SECONDS = '180'
    }

    stages {
        stage('Wait for Docker Images') {
            steps {
                echo "Waiting ${IMAGE_PUBLISH_WAIT_SECONDS}s for GitHub Actions to finish Docker Hub push"
                sh 'sleep ${IMAGE_PUBLISH_WAIT_SECONDS}'
            }
        }

        stage('Apply Manifests') {
            steps {
                sh 'kubectl apply -f k3s/mariadb.yaml'
                sh 'kubectl apply -f k3s/backend-deployment.yaml'
                sh 'kubectl apply -f k3s/frontend-deployment.yaml'
                sh 'kubectl apply -f k3s/ingress.yaml'
            }
        }

        stage('Deploy') {
            steps {
                sh 'kubectl rollout restart deployment/${FRONTEND_DEPLOYMENT} -n ${NAMESPACE}'
                sh 'kubectl rollout restart deployment/${BACKEND_DEPLOYMENT} -n ${NAMESPACE}'
                sh 'kubectl rollout status deployment/${FRONTEND_DEPLOYMENT} -n ${NAMESPACE} --timeout=180s'
                sh 'kubectl rollout status deployment/${BACKEND_DEPLOYMENT} -n ${NAMESPACE} --timeout=180s'
            }
        }

        stage('Verify') {
            steps {
                sh 'kubectl get pods -n ${NAMESPACE} -o wide'
                sh 'kubectl get ingress -n ${NAMESPACE}'
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
