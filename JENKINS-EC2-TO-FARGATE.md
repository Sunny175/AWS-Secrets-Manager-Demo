# 🚀 Complete Guide: Install Jenkins on AWS EC2 & Automate GitHub to ECS Fargate CI/CD

This step-by-step guide explains how to set up **Jenkins on an AWS EC2 instance**, connect it to your **GitHub repository via Webhooks**, and automatically build, push to **Amazon ECR**, and deploy to **AWS ECS Fargate** whenever you push code changes.

---

## 🏗️ End-to-End Architecture

```
                                  +-----------------------+
                                  |  Developer (Local)    |
                                  +-----------+-----------+
                                              |
                                              | git push
                                              v
                                  +-----------+-----------+
                                  |  GitHub Repository    |
                                  +-----------+-----------+
                                              |
                                              | Webhook Notification
                                              v
                               +--------------+--------------+
                               | AWS EC2 Instance (Jenkins)  |
                               |  - Compiles Java 25 App     |
                               |  - Builds Docker Image      |
                               +--------------+--------------+
                                              |
                                              | docker push
                                              v
+-------------------------------+  <----------+--------  +-------------------------------+
|  Amazon ECR                   |                        |  AWS ECS Fargate              |
|  (watchmode-movie-app:latest) +--------------------->  |  (Runs App in Cloud)          |
+-------------------------------+                        +-------------------------------+
```

---

## 📋 Step 1: Launch an AWS EC2 Instance for Jenkins

1. Go to **AWS Console** -> **EC2** -> Click **Launch Instance**.
2. **Instance Name**: `Jenkins-Server`
3. **AMI**: Ubuntu Server 22.04 LTS (or 24.04 LTS)
4. **Instance Type**: `t3.medium` (Recommended: 2 vCPU, 4GB RAM for Docker builds).
5. **Key Pair**: Select your SSH key pair.
6. **Network / Security Group Rules**:
   - Allow **SSH** (Port `22`) from your IP.
   - Allow **Custom TCP** (Port `8080`) from Anywhere (`0.0.0.0/0`) for Jenkins Web UI.
   - Allow **HTTP** (Port `80`) from Anywhere.
7. Click **Launch Instance**.

---

## 🛠️ Step 2: Install Java 21/25, Docker, AWS CLI & Jenkins on EC2

SSH into your EC2 instance (`ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>`) and run:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install OpenJDK 21/25 & prerequisites
sudo apt install -y openjdk-21-jdk fontconfig wget curl git apt-transport-https ca-certificates gnupg

# 3. Install Docker Engine
sudo apt install -y docker.io
sudo systemctl enable --now docker

# 4. Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo apt install -y unzip
unzip awscliv2.zip
sudo ./aws/install

# 5. Add Jenkins official repository & install Jenkins
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /etc/apt/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update
sudo apt install -y jenkins

# 6. Grant Docker permissions to Jenkins user
sudo usermod -aG docker jenkins
sudo systemctl restart docker
sudo systemctl enable --now jenkins
```

---

## 🔐 Step 3: Attach IAM Role to EC2 Instance (Best Practice)

Instead of manually creating AWS access key IDs, attach an **IAM Role** directly to your EC2 instance so Jenkins can communicate with ECR & Fargate automatically:

1. Open AWS Console -> **IAM** -> **Roles** -> **Create Role**.
2. Select **AWS service** -> **EC2**.
3. Attach Policies:
   - `AmazonEC2ContainerRegistryPowerUser` (For pushing Docker images to ECR)
   - `AmazonECS_FullAccess` (For updating Fargate services)
   - `SecretsManagerReadWrite` (For AWS Secrets Manager)
4. Name the Role: `Jenkins-EC2-Role` and click **Create Role**.
5. Go to **EC2 Console** -> Select your `Jenkins-Server` instance -> **Actions** -> **Security** -> **Modify IAM Role**.
6. Select `Jenkins-EC2-Role` and click **Update IAM Role**.

---

## ☁️ Step 3.5: One-Time AWS Infrastructure Setup (ECR, Secrets Manager & ECS Fargate)

> 💡 **Where to run these commands**:
> You can execute these `aws` CLI commands from any of the following locations:
> 1. **AWS CloudShell** (Directly in AWS Console header — no installation needed)
> 2. **SSH session on your Jenkins EC2 Instance**
> 3. **Local Terminal / PowerShell** (if AWS CLI is configured via `aws configure`)

### 1. Store Watchmode API Key in AWS Secrets Manager
```bash
aws secretsmanager create-secret \
    --name "/AWS-Secrets-Manager-Demo/third-party-token" \
    --description "Watchmode API key for Movie Discovery App" \
    --secret-string '{"watchmode-api-key":"YOUR_ACTUAL_WATCHMODE_API_KEY"}' \
    --region us-east-1
```

### 2. Create Amazon ECR Repository
```bash
aws ecr create-repository \
    --repository-name watchmode-movie-app \
    --region us-east-1
```

### 3. Update & Register ECS Task Definition
Update `YOUR_ACCOUNT_ID` in `aws/task-definition.json` with your 12-digit AWS Account ID, then register the task definition:
```bash
aws ecs register-task-definition --cli-input-json file://aws/task-definition.json --region us-east-1
```

### 4. Create ECS Fargate Cluster & Service
```bash
# A. Create Cluster
aws ecs create-cluster --cluster-name watchmode-cluster --region us-east-1

# B. Create Fargate Service
aws ecs create-service \
    --cluster watchmode-cluster \
    --service-name watchmode-service \
    --task-definition watchmode-movie-app-task \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
    --region us-east-1
```
*(Replace `subnet-xxx` and `sg-xxx` with your Default VPC Subnet ID and Security Group ID)*.

---

## 🔓 Step 4: Unlock & Setup Jenkins Web UI


1. Get initial admin password from EC2 terminal:
   ```bash
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```
2. Open browser at: **`http://<EC2-PUBLIC-IP>:8080`**
3. Paste the password and click **Continue**.
4. Select **Install Suggested Plugins**.
5. Create your Admin Username & Password.
6. Go to **Manage Jenkins** -> **Plugins** -> **Available Plugins** and install:
   - **Docker Pipeline**
   - **Pipeline: AWS Steps**
   - **GitHub Integration Plugin**
7. Click **Restart Jenkins when installation is complete**.

---

## 🔗 Step 5: Connect GitHub Webhook to Jenkins

This step tells GitHub to automatically notify Jenkins whenever you push code changes:

1. Open your GitHub Repository -> **Settings** -> **Webhooks** -> **Add webhook**.
2. **Payload URL**: `http://<EC2-PUBLIC-IP>:8080/github-webhook/`
   *(Ensure trailing slash `/github-webhook/` is included)*
3. **Content type**: `application/json`
4. **Which events would you like to trigger this webhook?**: Select `Just the push event`.
5. Click **Add webhook**. *(You should see a green checkmark icon in GitHub)*

---

## ⚙️ Step 6: Create the Pipeline Job in Jenkins

1. Open Jenkins UI -> Click **New Item**.
2. Item Name: `watchmode-movie-app-pipeline`
3. Select **Pipeline** project -> Click **OK**.
4. In **Build Triggers** section:
   - Check **GitHub hook trigger for GPM SCM polling**.
5. In **Pipeline** section:
   - **Definition**: Select `Pipeline script from SCM`
   - **SCM**: Select `Git`
   - **Repository URL**: `https://github.com/YOUR_USERNAME/AWS-Secrets-Manager-Demo.git`
   - **Branch Specifier**: `*/main` (or `*/master`)
   - **Script Path**: `Jenkinsfile`
6. Click **Save**.

---

## 🧪 Step 7: Test Auto-Deployment on Code Push

Now test the complete automated flow:

1. Edit any file in your project locally (e.g. update `README.md` or Java code).
2. Commit and push changes to GitHub:
   ```bash
   git add .
   git commit -m "Update application - trigger pipeline"
   git push origin main
   ```
3. **Watch the magic happen**:
   - GitHub sends a webhook signal to Jenkins on EC2.
   - Jenkins triggers the job automatically.
   - Jenkins pulls code, compiles Java 25 app, builds Docker image, pushes it to Amazon ECR, and updates AWS ECS Fargate!
   - Your live cloud app updates with zero downtime! 🚀

---

## 📄 File References in Repository
- **[Jenkinsfile](file:///c:/Users/Sunny/SpringBootWithAWSSecretsManager/AWS-Secrets-Manager-Demo/Jenkinsfile)**: Declarative pipeline configuration script.
- **[Dockerfile](file:///c:/Users/Sunny/SpringBootWithAWSSecretsManager/AWS-Secrets-Manager-Demo/Dockerfile)**: Java 25 multi-stage container build file.
- **[DEPLOY-FARGATE.md](file:///c:/Users/Sunny/SpringBootWithAWSSecretsManager/AWS-Secrets-Manager-Demo/DEPLOY-FARGATE.md)**: AWS Fargate cluster setup guide.
