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
        logger.info("Generating test code for: {}", jiraTicket.getKey());
        logger.info("Language: {}", language);
        logger.info("Description length: {}", jiraTicket.getDescription() != null ? jiraTicket.getDescription().length() : 0);
        
        String prompt = buildEnhancedPrompt(jiraTicket, language);
        String response = callOpenAI(prompt);
        
        logger.info("Generated code length: {}", response.length());
        
        return parseOpenAIResponse(response, jiraTicket.getKey(), language);
    }
    
    private String buildEnhancedPrompt(JiraTicket jiraTicket, String language) {
        StringBuilder prompt = new StringBuilder();
        
        if ("java".equalsIgnoreCase(language)) {
            prompt.append("You are an expert test automation engineer. Generate a complete, executable Spring Boot test project with comprehensive test coverage based on the following JIRA acceptance criteria.\n\n");
            prompt.append("JIRA Ticket: ").append(jiraTicket.getKey()).append("\n");
            prompt.append("Summary: ").append(jiraTicket.getSummary()).append("\n\n");
            prompt.append("Acceptance Criteria:\n").append(jiraTicket.getDescription()).append("\n\n");
            
            prompt.append("CRITICAL REQUIREMENTS:\n");
            prompt.append("1. Generate a COMPLETE, EXECUTABLE Maven project that compiles without errors\n");
            prompt.append("2. Include comprehensive pom.xml with ALL necessary dependencies with VALID VERSIONS (Spring Boot 3.1.0, RestAssured 5.3.0, TestNG 7.8.0, Selenium 4.11.0)\n");
            prompt.append("3. Create MULTIPLE test classes covering ALL acceptance criteria scenarios:\n");
            prompt.append("   - Positive test cases (happy path)\n");
            prompt.append("   - Negative test cases (error scenarios)\n");
            prompt.append("   - Edge cases and boundary conditions\n");
            prompt.append("   - API validation tests (status codes, response format, data validation)\n");
            prompt.append("   - Integration tests if applicable\n");
            prompt.append("4. Use RestAssured for API testing with proper assertions\n");
            prompt.append("5. Include data-driven tests where applicable\n");
            prompt.append("6. Add proper test configuration and setup/teardown methods\n");
            prompt.append("7. Include a working Spring Boot Application class\n");
            prompt.append("8. Add comprehensive application.properties with test configurations\n");
            prompt.append("9. Ensure ALL imports are correct and code follows best practices\n");
            prompt.append("10. Add detailed comments explaining test scenarios\n\n");
            
            prompt.append("TEST SCENARIOS TO COVER:\n");
            prompt.append("- Create/Add operations: Test successful creation, duplicate handling, validation errors\n");
            prompt.append("- Read/View operations: Test data retrieval, filtering, pagination, not found scenarios\n");
            prompt.append("- Update operations: Test successful updates, partial updates, validation, not found\n");
            prompt.append("- Delete operations: Test successful deletion, not found, cascade effects\n");
            prompt.append("- Authentication/Authorization: Test access control if mentioned\n");
            prompt.append("- Data validation: Test required fields, format validation, business rules\n");
            prompt.append("- Performance: Basic load testing if applicable\n\n");
            
            prompt.append("Return the response as a JSON object with this EXACT structure:\n");
            prompt.append("{\n");
            prompt.append("  \"files\": {\n");
            prompt.append("    \"pom.xml\": \"<complete pom.xml with all dependencies>\",\n");
            prompt.append("    \"src/main/java/com/test/Application.java\": \"<Spring Boot Application class>\",\n");
            prompt.append("    \"src/test/java/com/test/ApiTest.java\": \"<Main API test class>\",\n");
            prompt.append("    \"src/test/java/com/test/IntegrationTest.java\": \"<Integration test class>\",\n");
            prompt.append("    \"src/test/java/com/test/NegativeTest.java\": \"<Negative scenario tests>\",\n");
            prompt.append("    \"src/main/resources/application.properties\": \"<application properties>\",\n");
            prompt.append("    \"src/test/resources/test-data.json\": \"<test data file>\",\n");
            prompt.append("    \"README.md\": \"<project documentation with run instructions>\"\n");
            prompt.append("  }\n");
            prompt.append("}\n");
            
        } else if ("python".equalsIgnoreCase(language)) {
            prompt.append("You are an expert test automation engineer. Generate a complete, executable Python test project with comprehensive test coverage based on the following JIRA acceptance criteria.\n\n");
            prompt.append("JIRA Ticket: ").append(jiraTicket.getKey()).append("\n");
            prompt.append("Summary: ").append(jiraTicket.getSummary()).append("\n\n");
            prompt.append("Acceptance Criteria:\n").append(jiraTicket.getDescription()).append("\n\n");
            
            prompt.append("CRITICAL REQUIREMENTS:\n");
            prompt.append("1. Generate a COMPLETE, EXECUTABLE Python project\n");
            prompt.append("2. Include comprehensive requirements.txt with ALL necessary dependencies with VALID VERSIONS\n");
            prompt.append("3. Create MULTIPLE test files covering ALL acceptance criteria scenarios with both positive and negative test cases\n");
            prompt.append("4. Use pytest framework with proper fixtures and parametrization\n");
            prompt.append("5. Use requests library for API testing with comprehensive assertions\n");
            prompt.append("6. Include data-driven tests and test configuration\n");
            prompt.append("7. Add proper setup and teardown methods\n");
            prompt.append("8. Include detailed comments and documentation\n\n");
            
            prompt.append("Return the response as a JSON object with this EXACT structure:\n");
            prompt.append("{\n");
            prompt.append("  \"files\": {\n");
            prompt.append("    \"requirements.txt\": \"<all dependencies with versions>\",\n");
            prompt.append("    \"test_api.py\": \"<main API tests>\",\n");
            prompt.append("    \"test_integration.py\": \"<integration tests>\",\n");
            prompt.append("    \"test_negative.py\": \"<negative scenario tests>\",\n");
            prompt.append("    \"conftest.py\": \"<pytest configuration and fixtures>\",\n");
            prompt.append("    \"config.py\": \"<test configuration>\",\n");
            prompt.append("    \"test_data.json\": \"<test data file>\",\n");
            prompt.append("    \"README.md\": \"<project documentation>\"\n");
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
        requestBody.put("max_tokens", 12000);
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
            String content = jsonResponse.path("choices").get(0).path("message").path("content").asText();
            
            logger.debug("Extracted content length: {}", content.length());
            
            return content;
            
        } catch (Exception e) {
            logger.error("Error calling OpenAI API: ", e);
            throw new RuntimeException("Failed to call OpenAI API", e);
        }
    }
    
    private GeneratedTestProject parseOpenAIResponse(String response, String ticketKey, String language) {
        try {
            // Extract JSON from OpenAI response
            String jsonStart = response.indexOf("{");
            String jsonEnd = response.lastIndexOf("}") + 1;
            
            if (jsonStart == -1 || jsonEnd == 0) {
                throw new RuntimeException("No valid JSON found in OpenAI response");
            }
            
            String jsonContent = response.substring(jsonStart, jsonEnd);
            JsonNode jsonNode = objectMapper.readTree(jsonContent);
            JsonNode filesNode = jsonNode.path("files");
            
            Map<String, String> files = new HashMap<>();
            filesNode.fields().forEachRemaining(entry -> {
                files.put(entry.getKey(), entry.getValue().asText());
            });
            
            return new GeneratedTestProject(files, ticketKey + "-tests", language);
            
        } catch (Exception e) {
            logger.error("Error parsing OpenAI response: ", e);
            throw new RuntimeException("Failed to parse OpenAI response", e);
        }
    }
}
