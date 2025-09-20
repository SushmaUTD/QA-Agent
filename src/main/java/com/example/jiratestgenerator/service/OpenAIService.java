package com.example.jiratestgenerator.service;

import com.example.jiratestgenerator.model.GeneratedTestProject;
import com.example.jiratestgenerator.model.JiraTicket;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Service
public class OpenAIService {
    
    private static final Logger logger = LoggerFactory.getLogger(OpenAIService.class);
    
    @Value("${openai.api.key}")
    private String openAiApiKey;
    
    @Value("${openai.api.url}")
    private String openAiApiUrl;
    
    @Value("${openai.model}")
    private String openAiModel;
    
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    
    public OpenAIService() {
        this.webClient = WebClient.builder().build();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Generate test project based on JIRA ticket acceptance criteria
     */
    public GeneratedTestProject generateTestProject(JiraTicket jiraTicket, String language) {
        logger.info("Generating {} test project for JIRA ticket: {}", language, jiraTicket.getKey());
        
        try {
            String prompt = buildPrompt(jiraTicket, language);
            String response = callOpenAI(prompt);
            
            return parseOpenAIResponse(response, jiraTicket.getKey(), language);
            
        } catch (Exception e) {
            logger.error("Error generating test project: ", e);
            return generateFallbackProject(jiraTicket, language);
        }
    }
    
    private String buildPrompt(JiraTicket jiraTicket, String language) {
        StringBuilder prompt = new StringBuilder();
        
        if ("java".equalsIgnoreCase(language)) {
            prompt.append("Generate a complete Spring Boot test project with Selenium/RestAssured tests based on the following JIRA acceptance criteria.\n\n");
            prompt.append("JIRA Ticket: ").append(jiraTicket.getKey()).append("\n");
            prompt.append("Summary: ").append(jiraTicket.getSummary()).append("\n\n");
            prompt.append("Acceptance Criteria:\n").append(jiraTicket.getDescription()).append("\n\n");
            
            prompt.append("Requirements:\n");
            prompt.append("1. Generate a complete Maven project structure\n");
            prompt.append("2. Include pom.xml with all necessary dependencies (Spring Boot, RestAssured, TestNG, Selenium)\n");
            prompt.append("3. Create test classes that validate ALL acceptance criteria\n");
            prompt.append("4. Use RestAssured for API testing\n");
            prompt.append("5. Include proper assertions and status code validations\n");
            prompt.append("6. Add application.properties with test configuration\n");
            prompt.append("7. Include a main Application class\n");
            prompt.append("8. Ensure all imports are correct and code compiles without errors\n\n");
            
            prompt.append("Return the response as a JSON object with this structure:\n");
            prompt.append("{\n");
            prompt.append("  \"files\": {\n");
            prompt.append("    \"pom.xml\": \"<pom.xml content>\",\n");
            prompt.append("    \"src/main/java/com/test/Application.java\": \"<Application class content>\",\n");
            prompt.append("    \"src/test/java/com/test/ApiTest.java\": \"<Test class content>\",\n");
            prompt.append("    \"src/main/resources/application.properties\": \"<properties content>\"\n");
            prompt.append("  }\n");
            prompt.append("}\n");
            
        } else if ("python".equalsIgnoreCase(language)) {
            prompt.append("Generate a complete Python test project with pytest and requests based on the following JIRA acceptance criteria.\n\n");
            prompt.append("JIRA Ticket: ").append(jiraTicket.getKey()).append("\n");
            prompt.append("Summary: ").append(jiraTicket.getSummary()).append("\n\n");
            prompt.append("Acceptance Criteria:\n").append(jiraTicket.getDescription()).append("\n\n");
            
            prompt.append("Requirements:\n");
            prompt.append("1. Generate a complete Python project structure\n");
            prompt.append("2. Include requirements.txt with all necessary dependencies (pytest, requests, selenium)\n");
            prompt.append("3. Create test files that validate ALL acceptance criteria\n");
            prompt.append("4. Use requests library for API testing\n");
            prompt.append("5. Include proper assertions and status code validations\n");
            prompt.append("6. Add configuration files\n");
            prompt.append("7. Ensure all imports are correct\n\n");
            
            prompt.append("Return the response as a JSON object with this structure:\n");
            prompt.append("{\n");
            prompt.append("  \"files\": {\n");
            prompt.append("    \"requirements.txt\": \"<requirements content>\",\n");
            prompt.append("    \"test_api.py\": \"<Test file content>\",\n");
            prompt.append("    \"config.py\": \"<Config file content>\"\n");
            prompt.append("  }\n");
            prompt.append("}\n");
        }
        
        return prompt.toString();
    }
    
    private String callOpenAI(String prompt) {
        logger.debug("Calling OpenAI API with prompt length: {}", prompt.length());
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", openAiModel);
        requestBody.put("messages", new Object[]{
            Map.of("role", "user", "content", prompt)
        });
        requestBody.put("max_tokens", 4000);
        requestBody.put("temperature", 0.1);
        
        try {
            Mono<String> response = webClient.post()
                .uri(openAiApiUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + openAiApiKey)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class);
            
            String result = response.block();
            logger.debug("OpenAI API response received");
            
            // Parse the response to extract the content
            JsonNode jsonResponse = objectMapper.readTree(result);
            return jsonResponse.path("choices").get(0).path("message").path("content").asText();
            
        } catch (Exception e) {
            logger.error("Error calling OpenAI API: ", e);
            throw new RuntimeException("Failed to call OpenAI API", e);
        }
    }
    
    private GeneratedTestProject parseOpenAIResponse(String response, String ticketKey, String language) {
        try {
            logger.debug("Parsing OpenAI response for ticket: {}", ticketKey);
            
            // Clean the response - remove markdown formatting if present
            String cleanedResponse = response.trim();
            if (cleanedResponse.startsWith("```json")) {
                cleanedResponse = cleanedResponse.substring(7);
            }
            if (cleanedResponse.endsWith("```")) {
                cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length() - 3);
            }
            
            JsonNode jsonResponse = objectMapper.readTree(cleanedResponse);
            JsonNode filesNode = jsonResponse.path("files");
            
            Map<String, String> files = new HashMap<>();
            filesNode.fields().forEachRemaining(entry -> {
                files.put(entry.getKey(), entry.getValue().asText());
            });
            
            return new GeneratedTestProject(files, ticketKey + "-tests", language);
            
        } catch (Exception e) {
            logger.error("Error parsing OpenAI response: ", e);
            logger.debug("Raw response: {}", response);
            throw new RuntimeException("Failed to parse OpenAI response", e);
        }
    }
    
    private GeneratedTestProject generateFallbackProject(JiraTicket jiraTicket, String language) {
        logger.warn("Generating fallback project for ticket: {}", jiraTicket.getKey());
        
        Map<String, String> files = new HashMap<>();
        
        if ("java".equalsIgnoreCase(language)) {
            files.put("pom.xml", generateFallbackPom());
            files.put("src/main/java/com/test/Application.java", generateFallbackApplication());
            files.put("src/test/java/com/test/ApiTest.java", generateFallbackJavaTest(jiraTicket));
            files.put("src/main/resources/application.properties", "server.port=8080\nlogging.level.com.test=DEBUG");
        } else {
            files.put("requirements.txt", "pytest==7.4.0\nrequests==2.31.0\nselenium==4.11.2");
            files.put("test_api.py", generateFallbackPythonTest(jiraTicket));
            files.put("config.py", "BASE_URL = 'http://localhost:8080'\nTIMEOUT = 30");
        }
        
        return new GeneratedTestProject(files, jiraTicket.getKey() + "-tests", language);
    }
    
    private String generateFallbackPom() {
        return """
            <?xml version="1.0" encoding="UTF-8"?>
            <project xmlns="http://maven.apache.org/POM/4.0.0">
                <modelVersion>4.0.0</modelVersion>
                <groupId>com.test</groupId>
                <artifactId>api-tests</artifactId>
                <version>1.0.0</version>
                <properties>
                    <maven.compiler.source>17</maven.compiler.source>
                    <maven.compiler.target>17</maven.compiler.target>
                </properties>
                <dependencies>
                    <dependency>
                        <groupId>io.rest-assured</groupId>
                        <artifactId>rest-assured</artifactId>
                        <version>5.3.0</version>
                    </dependency>
                    <dependency>
                        <groupId>org.testng</groupId>
                        <artifactId>testng</artifactId>
                        <version>7.8.0</version>
                    </dependency>
                </dependencies>
            </project>
            """;
    }
    
    private String generateFallbackApplication() {
        return """
            package com.test;
            
            import org.springframework.boot.SpringApplication;
            import org.springframework.boot.autoconfigure.SpringBootApplication;
            
            @SpringBootApplication
            public class Application {
                public static void main(String[] args) {
                    SpringApplication.run(Application.class, args);
                }
            }
            """;
    }
    
    private String generateFallbackJavaTest(JiraTicket jiraTicket) {
        return String.format("""
            package com.test;
            
            import io.restassured.RestAssured;
            import org.testng.annotations.Test;
            import static io.restassured.RestAssured.given;
            import static org.hamcrest.Matchers.*;
            
            public class ApiTest {
                
                @Test
                public void test%s() {
                    // Test for JIRA ticket: %s
                    // Summary: %s
                    
                    given()
                        .contentType("application/json")
                    .when()
                        .get("/api/test")
                    .then()
                        .statusCode(200);
                }
            }
            """, jiraTicket.getKey().replace("-", ""), jiraTicket.getKey(), jiraTicket.getSummary());
    }
    
    private String generateFallbackPythonTest(JiraTicket jiraTicket) {
        return String.format("""
            import pytest
            import requests
            from config import BASE_URL
            
            def test_%s():
                \"\"\"Test for JIRA ticket: %s - %s\"\"\"
                response = requests.get(f"{BASE_URL}/api/test")
                assert response.status_code == 200
            """, jiraTicket.getKey().toLowerCase().replace("-", "_"), jiraTicket.getKey(), jiraTicket.getSummary());
    }
}
