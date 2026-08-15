# AWS Fargate Deployment Guide - Watchmode Movie Discovery App

This document provides step-by-step instructions for deploying the Spring Boot Watchmode Movie App onto **AWS ECS Fargate** with **AWS Secrets Manager** integration.

---

## Architecture Overview

```
[ User Browser ]
       │
       ▼ (Port 80 / 443)
[ AWS Application Load Balancer ]
       │
       ▼ (Port 8080)
[ AWS ECS Fargate Task (Container) ]
       │
       ├──► Read Secrets ──► [ AWS Secrets Manager ] ("/AWS-Secrets-Manager-Demo/third-party-token")
       │
       └──► Fetch Data ───► [ Watchmode API ] (https://api.watchmode.com/v1)
```

---

## Step 1: Store Watchmode API Key in AWS Secrets Manager

1. Open AWS Console -> **Secrets Manager** -> **Store a new secret**.
2. Select **Other type of secret**.
3. Choose **Key/value** tab and add:
   - **Key**: `watchmode-api-key`
   - **Value**: `YOUR_WATCHMODE_API_KEY_FROM_DASHBOARD`
4. Set Secret Name to: `/AWS-Secrets-Manager-Demo/third-party-token`
5. Select Region: `us-east-1` (or your preferred AWS region).
6. Click **Store secret**.

---

## Step 2: Build Docker Image and Push to Amazon ECR

### 1. Authenticate Docker with Amazon ECR
```bash
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

### 2. Create ECR Repository
```bash
aws ecr create-repository \
    --repository-name watchmode-movie-app \
    --region $AWS_REGION
```

### 3. Build & Tag Container Image
```bash
docker build -t watchmode-movie-app .

docker tag watchmode-movie-app:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/watchmode-movie-app:latest
```

### 4. Push to Amazon ECR
```bash
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/watchmode-movie-app:latest
```

---

## Step 3: Create IAM Roles for ECS Fargate & Secrets Manager

### 1. Task Execution Role (`ecsTaskExecutionRole`)
Attach `AmazonECSTaskExecutionRolePolicy` managed policy, plus an inline policy allowing `secretsmanager:GetSecretValue`:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue"
            ],
            "Resource": [
                "arn:aws:secretsmanager:us-east-1:*:secret:/AWS-Secrets-Manager-Demo/third-party-token-*"
            ]
        }
    ]
}
```

---

## Step 4: Register ECS Task Definition & Deploy

### 1. Update `aws/task-definition.json`
Replace `YOUR_ACCOUNT_ID` with your AWS Account ID in `aws/task-definition.json`.

### 2. Register Task Definition
```bash
aws ecs register-task-definition --cli-input-json file://aws/task-definition.json
```

### 3. Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name watchmode-cluster
```

### 4. Create Fargate Service
```bash
SUBNET_1="subnet-xxxxxx1"
SUBNET_2="subnet-xxxxxx2"
SEC_GROUP="sg-xxxxxx"

aws ecs create-service \
    --cluster watchmode-cluster \
    --service-name watchmode-service \
    --task-definition watchmode-movie-app-task \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$SEC_GROUP],assignPublicIp=ENABLED}"
```

---

## Step 5: Verification & CloudWatch Monitoring

1. Find the Public IP or Load Balancer DNS name assigned to the ECS task.
2. Access `http://<PUBLIC_IP>:8080/` in your browser.
3. Verify status endpoint: `http://<PUBLIC_IP>:8080/api/movies/status`
4. Inspect logs in CloudWatch under log group `/ecs/watchmode-movie-app`.
