pipeline {
    agent any

    environment {
        AWS_REGION         = 'us-east-1'
        AWS_CREDENTIALS_ID = 'aws-credentials' // Jenkins Credential ID for AWS
        ECR_REPO_NAME      = 'watchmode-movie-app'
        APP_NAME           = 'watchmode-movie-app'
        IMAGE_TAG          = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Checkout repository source code...'
                checkout scm
            }
        }

        stage('Compile & Test') {
            steps {
                echo 'Building Spring Boot application with Maven Wrapper...'
                sh 'chmod +x mvnw'
                sh './mvnw clean test -B'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Java 25 Docker image...'
                script {
                    dockerImage = docker.build("${APP_NAME}:${IMAGE_TAG}")
                }
            }
        }

        stage('Push Image to Amazon ECR') {
            steps {
                echo 'Pushing Docker image to Amazon ECR...'
                withAWS(credentials: "${AWS_CREDENTIALS_ID}", region: "${AWS_REGION}") {
                    script {
                        def accountId = sh(script: "aws sts get-caller-identity --query Account --output text", returnStdout: true).trim()
                        def ecrUri    = "${accountId}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

                        // Login to ECR
                        sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${accountId}.dkr.ecr.${AWS_REGION.toLowerCase()}.amazonaws.com"

                        // Tag & Push
                        sh "docker tag ${APP_NAME}:${IMAGE_TAG} ${ecrUri}:${IMAGE_TAG}"
                        sh "docker tag ${APP_NAME}:${IMAGE_TAG} ${ecrUri}:latest"
                        sh "docker push ${ecrUri}:${IMAGE_TAG}"
                        sh "docker push ${ecrUri}:latest"
                    }
                }
            }
        }

        stage('Deploy to AWS ECS Fargate') {
            steps {
                echo 'Updating AWS ECS Fargate service...'
                withAWS(credentials: "${AWS_CREDENTIALS_ID}", region: "${AWS_REGION}") {
                    sh """
                        aws ecs update-service \
                            --cluster watchmode-cluster \
                            --service watchmode-service \
                            --force-new-deployment \
                            --region ${AWS_REGION}
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up local Docker images...'
            sh "docker rmi ${APP_NAME}:${IMAGE_TAG} || true"
        }
        success {
            echo 'Pipeline completed successfully! Application deployed to AWS Fargate.'
        }
        failure {
            echo 'Pipeline failed. Please inspect build logs.'
        }
    }
}
