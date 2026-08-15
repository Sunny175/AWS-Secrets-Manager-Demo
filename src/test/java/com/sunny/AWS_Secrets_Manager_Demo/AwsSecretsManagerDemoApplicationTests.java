package com.sunny.AWS_Secrets_Manager_Demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "spring.cloud.aws.secretsmanager.enabled=false",
    "spring.cloud.aws.region.static=us-east-1",
    "cloud.aws.region.static=us-east-1",
    "watchmode.api-key=test-api-key"
})
class AwsSecretsManagerDemoApplicationTests {

	@Test
	void contextLoads() {
	}

}


