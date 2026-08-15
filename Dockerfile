# Stage 1: Build Java 25 application using Maven Wrapper
FROM eclipse-temurin:25-jdk AS builder
WORKDIR /app

# Copy Maven wrapper and configuration
COPY pom.xml .
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn

# Copy source code
COPY src ./src

# Grant execute permission to wrapper and package JAR
RUN chmod +x mvnw && ./mvnw package -DskipTests

# Stage 2: Production Java 25 runtime image for AWS Fargate
FROM eclipse-temurin:25-jre
WORKDIR /app

# Create non-root system user for security compliance on AWS ECS Fargate
RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup

# Copy built JAR from builder stage
COPY --from=builder /app/target/AWS-Secrets-Manager-Demo-0.0.1-SNAPSHOT.jar app.jar

# Set permissions
RUN chown -R appuser:appgroup /app
USER appuser

# Expose port 8080
EXPOSE 8080

# Configure JVM flags and execution entrypoint
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
