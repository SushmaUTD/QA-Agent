package com.goldmansachs.qaagent.service;

import com.goldmansachs.qaagent.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TestGenerationService {

    @Autowired
    private OpenAIService openAIService;

    public TestGenerationResponse generateTests(TestGenerationRequest request) {
        try {
            // Build enhanced prompt with application configuration context
            String prompt = buildEnhancedPrompt(request);
            
            // Generate tests using OpenAI - this returns the complete project structure
            String generatedContent = openAIService.generateTests(prompt);
            
            TestGenerationResponse response = new TestGenerationResponse();
            response.setSuccess(true);
            
            return response;
        } catch (Exception e) {
            TestGenerationResponse response = new TestGenerationResponse();
            response.setError("Test generation failed: " + e.getMessage());
            response.setSuccess(false);
            return response;
        }
    }

    private String buildEnhancedPrompt(TestGenerationRequest request) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("You are an expert QA automation engineer specializing in Java Spring Boot test generation. ");
        prompt.append("Generate comprehensive, production-ready test cases based on the following context:\n\n");
        
        // Application Configuration Context
        if (request.getAppConfig() != null) {
            prompt.append("=== APPLICATION UNDER TEST ===\n");
            prompt.append("Base URL: ").append(request.getAppConfig().getBaseUrl()).append("\n");
            prompt.append("Environment: ").append(request.getAppConfig().getEnvironment()).append("\n");
            if (request.getAppConfig().getAuthDetails() != null && !request.getAppConfig().getAuthDetails().isEmpty()) {
                prompt.append("Authentication: ").append(request.getAppConfig().getAuthDetails()).append("\n");
            }
            if (request.getAppConfig().getDbConnectionInfo() != null && !request.getAppConfig().getDbConnectionInfo().isEmpty()) {
                prompt.append("Database: ").append(request.getAppConfig().getDbConnectionInfo()).append("\n");
            }
            prompt.append("\n");
        }
        
        // AI Configuration Context
        prompt.append("=== TEST REQUIREMENTS ===\n");
        prompt.append("Test Type: ").append(request.getAiConfig().getTestType()).append("\n");
        prompt.append("Coverage Target: ").append(request.getAiConfig().getCoverage()).append("%\n");
        prompt.append("Test Case Types: ").append(String.join(", ", request.getAiConfig().getTestCaseTypes())).append("\n");
        prompt.append("Download Format: ").append(request.getAiConfig().getDownloadFormat()).append("\n\n");
        
        // Tickets and Acceptance Criteria Analysis
        prompt.append("=== JIRA TICKETS TO TEST ===\n");
        for (JiraTicket ticket : request.getTickets()) {
            prompt.append("Ticket: ").append(ticket.getKey()).append(" - ").append(ticket.getSummary()).append("\n");
            prompt.append("Description: ").append(ticket.getDescription()).append("\n");
            prompt.append("Priority: ").append(ticket.getPriority()).append("\n");
            prompt.append("Status: ").append(ticket.getStatus()).append("\n");
            
            if (ticket.getAcceptanceCriteria() != null && !ticket.getAcceptanceCriteria().isEmpty()) {
                prompt.append("Acceptance Criteria:\n");
                for (String criteria : ticket.getAcceptanceCriteria()) {
                    prompt.append("- ").append(criteria).append("\n");
                    
                    // Enhanced analysis of acceptance criteria for API details
                    if (criteria.toLowerCase().contains("api") || criteria.toLowerCase().contains("endpoint")) {
                        prompt.append("  [API ENDPOINT DETECTED - Extract exact endpoint, HTTP method, request/response format]\n");
                    }
                    if (criteria.toLowerCase().contains("payload") || criteria.toLowerCase().contains("request")) {
                        prompt.append("  [PAYLOAD DETECTED - Use this as sample test data]\n");
                    }
                    if (criteria.toLowerCase().contains("response") || criteria.toLowerCase().contains("return")) {
                        prompt.append("  [RESPONSE FORMAT DETECTED - Validate this in tests]\n");
                    }
                }
            }
            prompt.append("\n");
        }
        
        prompt.append("=== GENERATION INSTRUCTIONS ===\n");
        prompt.append("Generate a complete Spring Boot test project with ALL necessary files.\n");
        prompt.append("Return ONLY a JSON response with this exact structure:\n");
        prompt.append("{\n");
        prompt.append("  \"files\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"path\": \"pom.xml\",\n");
        prompt.append("      \"content\": \"<complete pom.xml content>\"\n");
        prompt.append("    },\n");
        prompt.append("    {\n");
        prompt.append("      \"path\": \"src/main/java/com/example/Application.java\",\n");
        prompt.append("      \"content\": \"<complete Java application class>\"\n");
        prompt.append("    },\n");
        prompt.append("    {\n");
        prompt.append("      \"path\": \"src/test/java/com/example/ApiTest.java\",\n");
        prompt.append("      \"content\": \"<complete test class with real test methods>\"\n");
        prompt.append("    },\n");
        prompt.append("    {\n");
        prompt.append("      \"path\": \"README.md\",\n");
        prompt.append("      \"content\": \"<project documentation>\"\n");
        prompt.append("    }\n");
        prompt.append("  ]\n");
        prompt.append("}\n\n");
        prompt.append("IMPORTANT: Generate REAL, EXECUTABLE code based on the JIRA ticket requirements. Do not use placeholders or TODO comments.\n");
        
        return prompt.toString();
    }

    // - parseGeneratedContent() 
    // - generatePomXml()
    // - generateTestProperties()
    // - generateTestClass()
    // OpenAI now generates all content directly
}
