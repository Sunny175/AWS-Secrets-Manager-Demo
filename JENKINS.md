# Jenkins CI/CD Pipeline Guide - Watchmode Movie App

This guide explains how to set up an automated Jenkins CI/CD pipeline that compiles your Java 25 Spring Boot project, builds the Docker image, pushes it to **Amazon ECR**, and deploys it to **AWS ECS Fargate**.

---

## 🛠️ Step 1: Prerequisites on Your Jenkins Server

Make sure your Jenkins server has the following installed:

1. **Plugins Required in Jenkins**:
   - Go to `Manage Jenkins` -> `Plugins` -> `Available plugins`:
     - **Pipeline**
     - **Docker Pipeline**
     - **Pipeline: AWS Steps** (or **AWS Credentials Plugin**)
     - **Git Plugin**

2. **Tools Installed on Jenkins Agent/Host**:
   - **Docker** (Jenkins user must have permissions to run `docker` commands: `sudo usermod -aG docker jenkins`)
   - **AWS CLI v2** installed on the Jenkins server path.

---

## 🔐 Step 2: Configure AWS Credentials in Jenkins

1. Open Jenkins Dashboard -> **Manage Jenkins** -> **Credentials** -> **System** -> **Global credentials (unrestricted)**.
2. Click **Add Credentials**.
3. Select **Kind**: `AWS Credentials` (or `Username with password` / `Secret text`).
4. Fill in:
   - **ID**: `aws-credentials` *(Must match `AWS_CREDENTIALS_ID` in Jenkinsfile)*
   - **Access Key ID**: Your AWS IAM Access Key ID
   - **Secret Access Key**: Your AWS IAM Secret Access Key
5. Click **Create**.

> **Required IAM Permissions for Credentials**:
> The IAM user/role must have permissions for `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`, and `ecs:UpdateService`.

---

## 🚀 Step 3: Create Pipeline Job in Jenkins

1. Go to Jenkins Dashboard -> Click **New Item**.
2. Enter Name: `watchmode-movie-app-pipeline`
3. Select **Pipeline** project type and click **OK**.
4. Scroll down to the **Pipeline** section:
   - **Definition**: Select `Pipeline script from SCM`.
   - **SCM**: Select `Git`.
   - **Repository URL**: `https://github.com/YOUR_GITHUB_USERNAME/AWS-Secrets-Manager-Demo.git` (or your repository URL).
   - **Branch Specifier**: `*/main` or `*/master`
   - **Script Path**: `Jenkinsfile`
5. Click **Save**.

---

## ⚡ Step 4: Run the Pipeline

1. Click **Build Now** on the left sidebar of your Jenkins job.
2. The pipeline will execute the following stages automatically:
   - 📦 **Checkout Code**: Pulls latest commit from Git.
   - 🧪 **Compile & Test**: Builds Spring Boot JAR using Maven Wrapper.
   - 🐳 **Build Docker Image**: Creates container using Java 25 (`Dockerfile`).
   - ☁️ **Push Image to Amazon ECR**: Authenticates with AWS and pushes `:latest` and `:${BUILD_NUMBER}` tags.
   - 🚀 **Deploy to AWS ECS Fargate**: Triggers `--force-new-deployment` on your ECS Fargate cluster.

---

## 🔄 Jenkinsfile Structure Summary

```groovy
pipeline {
    agent any
    environment {
        AWS_REGION         = 'us-east-1'
        AWS_CREDENTIALS_ID = 'aws-credentials'
        ECR_REPO_NAME      = 'watchmode-movie-app'
    }
    stages {
        stage('Checkout Code') { ... }
        stage('Compile & Test') { ... }
        stage('Build Docker Image') { ... }
        stage('Push Image to Amazon ECR') { ... }
        stage('Deploy to AWS ECS Fargate') { ... }
    }
}
```
