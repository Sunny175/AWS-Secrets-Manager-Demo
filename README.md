# 🎬 CineStream - Watchmode Movie Discovery App

A modern, full-stack Movie Discovery Application built with **Spring Boot**, **Watchmode API**, **AWS Secrets Manager**, and prepared for **AWS ECS Fargate** cloud deployment.

![CineStream Architecture](https://img.shields.io/badge/Spring_Boot-4.1.0-brightgreen.svg)
![Java Version](https://img.shields.io/badge/Java-21%2F25-orange.svg)
![AWS Secrets Manager](https://img.shields.io/badge/AWS-Secrets_Manager-FF9900.svg)
![AWS Fargate](https://img.shields.io/badge/AWS-ECS_Fargate-232F3E.svg)

---

## 📌 Project Overview

**CineStream** allows users to search thousands of movies and discover where to stream, rent, or buy them across top platforms (Netflix, Amazon Prime Video, Apple TV, Max, Hulu, Disney+, etc.) with exact pricing, format resolution (4K, HD, SD), and direct links.

### Key Features
- 🔍 **Real-Time Movie Search**: Query titles live via Watchmode API with real-time feedback.
- 📺 **Where to Watch & Stream**: Comprehensive breakdown of subscription, rental, and purchase platforms per region.
- 🎨 **Cinematic Web UI**: Premium dark mode design system built with glassmorphism (`backdrop-filter`), ambient glows, responsive movie grid, and interactive modals.
- 🔐 **AWS Secrets Manager Integration**: Loads API keys securely from AWS (`/AWS-Secrets-Manager-Demo/third-party-token`) with seamless local fallback (`optional:aws-secretsmanager`).
- 🐳 **AWS ECS Fargate Containerized**: Multi-stage `Dockerfile` and `task-definition.json` configured for cloud deployment.
- 🛠️ **Demo / Fallback Mode**: Gracefully provides curated sample data if no API key or AWS credentials are available.

---

## 🛠️ Technology Stack

- **Backend**: Java 21/25, Spring Boot 4.1.0, Spring MVC, Spring Cloud AWS Secrets Manager (`io.awspring.cloud`)
- **Frontend**: HTML5, Vanilla CSS (Glassmorphism design system), JavaScript ES6+
- **REST Client**: Spring `RestClient` with Jackson JSON parsing
- **DevOps & Cloud**: Docker (multi-stage alpine), AWS ECS Fargate, AWS ECR, AWS Secrets Manager

---

## 🚀 How to Run the Project Locally

### Prerequisites
- **Java JDK 21 or 25** installed
- **Git**

---

### Option 1: Run with Maven Wrapper (Recommended)

1. **Navigate to the project directory**:
   ```bash
   cd c:\Users\Sunny\SpringBootWithAWSSecretsManager\AWS-Secrets-Manager-Demo
   ```

2. **Start the application using Maven Wrapper**:

   - **Windows (Command Prompt / PowerShell)**:
     ```powershell
     .\mvnw.cmd spring-boot:run
     ```
   - **Linux / macOS**:
     ```bash
     ./mvnw spring-boot:run
     ```

3. **Open in Browser**:
   Navigate to **`http://localhost:8080`** in your browser.

---

### Option 2: Build & Run Executable JAR

1. **Package the application into a runnable JAR**:
   ```powershell
   .\mvnw.cmd package -DskipTests
   ```

2. **Run the JAR file**:
   ```bash
   java -jar target/AWS-Secrets-Manager-Demo-0.0.1-SNAPSHOT.jar
   ```

3. **Access the application**:
   Open **`http://localhost:8080`**.

---

### Option 3: Run with Docker Container

1. **Build Docker image**:
   ```bash
   docker build -t watchmode-movie-app .
   ```

2. **Run Docker container**:
   ```bash
   docker run -d -p 8080:8080 --name watchmode-app watchmode-movie-app
   ```

3. **Access the application**:
   Open **`http://localhost:8080`**.

---

## ⚙️ Configuration & API Key

### Watchmode API Key Setup
The Watchmode API key is configured in `src/main/resources/application.yaml`:

```yaml
watchmode:
  api-key: ${WATCHMODE_API_KEY:dxg7HVmbNayz1vBiogfjLWOEQs90XFa3msEzjtGM}
  base-url: https://api.watchmode.com/v1
```

You can supply your key in any of the following ways:
1. **AWS Secrets Manager** (Production / AWS Fargate): Stored under secret name `/AWS-Secrets-Manager-Demo/third-party-token` with key `watchmode-api-key`.
2. **Environment Variable**: Set `WATCHMODE_API_KEY=your_key_here`.
3. **Web UI Header / Settings Modal**: Open the **API Key** settings modal in the web header to enter a custom key directly in your browser.

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Web Application Single Page Interface |
| `GET` | `/api/movies/popular` | Fetch popular/trending movies |
| `GET` | `/api/movies/search?q={query}` | Search movies by title |
| `GET` | `/api/movies/{id}` | Get full details & streaming availability for a title |
| `GET` | `/api/movies/status` | Check system status & AWS Secrets Manager integration state |

---

## ☁️ AWS ECS Fargate Deployment

For complete step-by-step instructions on packaging and deploying this application onto AWS ECS Fargate, refer to the included guide:

👉 **[DEPLOY-FARGATE.md](file:///c:/Users/Sunny/SpringBootWithAWSSecretsManager/AWS-Secrets-Manager-Demo/DEPLOY-FARGATE.md)**

### Quick Fargate Summary:
1. Create Secret in AWS Secrets Manager: `/AWS-Secrets-Manager-Demo/third-party-token`
2. Push container to Amazon ECR: `docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/watchmode-movie-app:latest`
3. Register Task Definition: `aws ecs register-task-definition --cli-input-json file://aws/task-definition.json`
4. Launch Fargate Service on ECS Cluster.

---

## 🔄 Jenkins CI/CD Pipeline

A production-ready declarative **[Jenkinsfile](file:///c:/Users/Sunny/SpringBootWithAWSSecretsManager/AWS-Secrets-Manager-Demo/Jenkinsfile)** is included in the project root.

### Pipeline Stages:
1. 📦 **Checkout Code**: Clones project from Git repository.
2. 🧪 **Compile & Test**: Runs Maven Wrapper tests (`./mvnw clean test`).
3. 🐳 **Build Docker Image**: Builds Java 25 runtime container (`Dockerfile`).
4. ☁️ **Push Image to Amazon ECR**: Authenticates with AWS and pushes tagged image.
5. 🚀 **Deploy to AWS ECS Fargate**: Triggers zero-downtime rolling update on ECS Fargate.

👉 **[JENKINS.md](file:///c:/Users/Sunny/SpringBootWithAWSSecretsManager/AWS-Secrets-Manager-Demo/JENKINS.md)** — Complete guide for setting up Jenkins plugins, credentials, and jobs.  
👉 **[JENKINS-EC2-TO-FARGATE.md](file:///c:/Users/Sunny/SpringBootWithAWSSecretsManager/AWS-Secrets-Manager-Demo/JENKINS-EC2-TO-FARGATE.md)** — Step-by-step tutorial for hosting Jenkins on EC2 & setting up GitHub Webhook auto-deployments.

---

## 📁 Project Folder Structure



```
AWS-Secrets-Manager-Demo/
├── aws/
│   └── task-definition.json      # AWS ECS Fargate Task Definition
├── src/
│   ├── main/
│   │   ├── java/com/sunny/AWS_Secrets_Manager_Demo/
│   │   │   ├── config/           # RestClient & ObjectMapper Beans
│   │   │   ├── controller/       # MovieController REST endpoints
│   │   │   ├── dto/              # Movie, Details, StreamingSource DTOs
│   │   │   └── service/          # WatchmodeService API Integration & Fallback
│   │   └── resources/
│   │       ├── application.yaml  # Spring Boot & AWS Configuration
│   │       └── static/           # Web UI (index.html, styles.css, app.js)
├── Dockerfile                    # Multi-stage Docker Build file
├── DEPLOY-FARGATE.md             # AWS ECS Fargate Deployment Guide
├── pom.xml                       # Maven Dependencies & Plugins
└── README.md                     # Project Documentation
```

---

## 📄 License

This project is open-source and available under the **MIT License**.
