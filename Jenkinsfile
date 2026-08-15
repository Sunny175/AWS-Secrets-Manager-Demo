pipeline {
    agent any

    environment {
        AWS_REGION         = 'us-east-1'
        AWS_CREDENTIALS_ID = '' // Set to 'aws-credentials' if using Jenkins Credentials Manager, or leave '' to use EC2 IAM Role
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
                    def dockerImage = docker.build("${APP_NAME}:${IMAGE_TAG}")
                }
            }
        }

        stage('Push Image to Amazon ECR') {
            steps {
                echo 'Pushing Docker image to Amazon ECR...'
                script {
                    def pushAction = {
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

                    if (env.AWS_CREDENTIALS_ID?.trim()) {
                        try {
                            withAWS(credentials: env.AWS_CREDENTIALS_ID, region: "${AWS_REGION}") {
                                pushAction()
                            }
                        } catch (Exception e) {
                            echo "Credential '${env.AWS_CREDENTIALS_ID}' not found or failed (${e.message}). Falling back to EC2 IAM Role..."
                            withAWS(region: "${AWS_REGION}") {
                                pushAction()
                            }
                        }
                    } else {
                        withAWS(region: "${AWS_REGION}") {
                            pushAction()
                        }
                    }
                }
            }
        }

        stage('Deploy to AWS ECS Fargate') {
            steps {
                echo 'Updating AWS ECS Fargate service...'
                script {
                    def deployAction = {
                        sh """
                            aws ecs update-service \
                                --cluster watchmode-cluster \
                                --service watchmode-service \
                                --force-new-deployment \
                                --region ${AWS_REGION}
                        """
                    }

                    if (env.AWS_CREDENTIALS_ID?.trim()) {
                        try {
                            withAWS(credentials: env.AWS_CREDENTIALS_ID, region: "${AWS_REGION}") {
                                deployAction()
                            }
                        } catch (Exception e) {
                            echo "Credential '${env.AWS_CREDENTIALS_ID}' not found or failed (${e.message}). Falling back to EC2 IAM Role..."
                            withAWS(region: "${AWS_REGION}") {
                                deployAction()
                            }
                        }
                    } else {
                        withAWS(region: "${AWS_REGION}") {
                            deployAction()
                        }
                    }
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


