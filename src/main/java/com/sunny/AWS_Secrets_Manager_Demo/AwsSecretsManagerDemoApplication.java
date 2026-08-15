package com.sunny.AWS_Secrets_Manager_Demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@EnableCaching
@SpringBootApplication
public class AwsSecretsManagerDemoApplication {

	public static void main(String[] args) {
		if (System.getProperty("aws.region") == null && System.getenv("AWS_REGION") == null) {
			System.setProperty("aws.region", "us-east-1");
		}
		SpringApplication.run(AwsSecretsManagerDemoApplication.class, args);
	}

}

