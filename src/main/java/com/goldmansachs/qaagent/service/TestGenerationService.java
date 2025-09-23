package com.goldmansachs.qaagent.service;

import com.goldmansachs.qaagent.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

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
        
        StringBuilder ticketDetails = new StringBuilder();
        for (int i = 0; i < request.getTickets().size(); i++) {
            JiraTicket ticket = request.getTickets().get(i);
            if (i > 0) {
                ticketDetails.append("\n\n---\n\n");
            }
            
            ticketDetails.append("**JIRA Ticket:** ").append(ticket.getKey()).append(" - ").append(ticket.getSummary()).append("\n");
            ticketDetails.append("**Description:** ").append(ticket.getDescription()).append("\n");
            ticketDetails.append("**Acceptance Criteria:**\n");
            if (ticket.getAcceptanceCriteria() != null && !ticket.getAcceptanceCriteria().isEmpty()) {
                for (String criteria : ticket.getAcceptanceCriteria()) {
                    ticketDetails.append("- ").append(criteria).append("\n");
                }
            }
            ticketDetails.append("**Status:** ").append(ticket.getStatus()).append("\n");
            ticketDetails.append("**Priority:** ").append(ticket.getPriority()).append("\n");
            ticketDetails.append("**Labels:** ").append(ticket.getLabels() != null ? String.join(", ", ticket.getLabels()) : "None").append("\n");
            ticketDetails.append("**Components:** ").append(ticket.getComponents() != null ? String.join(", ", ticket.getComponents()) : "None").append("\n");
            ticketDetails.append("**Epic:** ").append(ticket.getEpic() != null ? ticket.getEpic() : "None").append("\n");
            ticketDetails.append("**Story Points:** ").append(ticket.getStoryPoints() != null ? ticket.getStoryPoints().toString() : "Not estimated");
        }
        
        String baseUrl = request.getAppConfig() != null ? request.getAppConfig().getBaseUrl() : "http://localhost:8080";
        String environment = request.getAppConfig() != null ? request.getAppConfig().getEnvironment() : "dev";
        String authDetails = request.getAppConfig() != null ? request.getAppConfig().getAuthDetails() : "Basic Auth";
        
        prompt.append("Generate comprehensive Java test classes for API testing based on these JIRA tickets.\n\n");
        prompt.append("**APPLICATION CONTEXT:**\n");
        prompt.append("- Base URL: ").append(baseUrl).append("\n");
        prompt.append("- Environment: ").append(environment).append("\n");
        prompt.append("- Auth Details: ").append(authDetails).append("\n\n");
        prompt.append("**JIRA TICKETS:**\n");
        prompt.append(ticketDetails.toString()).append("\n\n");
        prompt.append("**REQUIREMENTS:**\n");
        prompt.append("1. **Comprehensive Test Classes** - Separate test classes for each major functionality\n");
        prompt.append("2. **RestAssured Framework** - Use RestAssured for API testing\n");
        prompt.append("3. **TestNG Annotations** - Use @Test, @BeforeClass, @DataProvider as needed\n");
        prompt.append("4. **Base Test Class** - Common setup and utilities\n");
        prompt.append("5. **Data Providers** - Test data management\n");
        prompt.append("6. **Comprehensive Test Cases** - Both positive and negative tests for each acceptance criteria\n");
        prompt.append("7. **Ready to Use** - Can be added directly to an existing Spring Boot project\n\n");
        prompt.append("**IMPORTANT: Respond with ONLY a JSON object in this exact format:**\n");
        prompt.append("{\n");
        prompt.append("  \"files\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"path\": \"src/test/java/com/example/BaseTest.java\",\n");
        prompt.append("      \"content\": \"GENERATE COMPREHENSIVE BASE TEST CLASS WITH SETUP AND UTILITIES\"\n");
        prompt.append("    },\n");
        prompt.append("    {\n");
        prompt.append("      \"path\": \"src/test/java/com/example/ApiTest.java\",\n");
        prompt.append("      \"content\": \"GENERATE COMPREHENSIVE API TEST CLASS WITH ALL ACCEPTANCE CRITERIA COVERED\"\n");
        prompt.append("    },\n");
        prompt.append("    {\n");
        prompt.append("      \"path\": \"src/test/java/com/example/DataProviders.java\",\n");
        prompt.append("      \"content\": \"GENERATE TEST DATA PROVIDERS CLASS\"\n");
        prompt.append("    }\n");
        prompt.append("  ]\n");
        prompt.append("}\n\n");
        prompt.append("Generate ALL files with complete, production-ready content. Each file should be substantial and fully functional. Do NOT include any markdown formatting, explanations, or text outside the JSON object.");
        
        return prompt.toString();
    }

    public byte[] generateTestsAsZip(TestGenerationRequest request) throws IOException {
        try {
            // Build enhanced prompt with application configuration context
            String prompt = buildEnhancedPrompt(request);
            
            // Generate tests using OpenAI - this returns the complete project structure
            String generatedContent = openAIService.generateTests(prompt);
            
            System.out.println("[v0] OpenAI response length: " + generatedContent.length());
            System.out.println("[v0] OpenAI response preview: " + generatedContent.substring(0, Math.min(500, generatedContent.length())));
            
            int jsonStart = generatedContent.indexOf("{");
            int jsonEnd = generatedContent.lastIndexOf("}") + 1;
            
            if (jsonStart == -1 || jsonEnd <= jsonStart) {
                throw new IOException("No valid JSON found in OpenAI response");
            }
            
            String jsonContent = generatedContent.substring(jsonStart, jsonEnd);
            System.out.println("[v0] Extracted JSON content: " + jsonContent.substring(0, Math.min(200, jsonContent.length())));
            
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode;
            try {
                rootNode = mapper.readTree(jsonContent);
            } catch (Exception e) {
                System.out.println("[v0] JSON parsing failed, attempting manual extraction: " + e.getMessage());
                throw new IOException("Failed to parse OpenAI response as JSON: " + e.getMessage());
            }
            
            JsonNode filesNode = rootNode.get("files");
            
            if (filesNode == null || !filesNode.isArray()) {
                throw new IOException("Invalid response format - missing files array");
            }
            
            // Create zip file in memory
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ZipOutputStream zos = new ZipOutputStream(baos);
            
            int filesFound = 0;
            for (JsonNode fileNode : filesNode) {
                JsonNode pathNode = fileNode.get("path");
                JsonNode contentNode = fileNode.get("content");
                
                if (pathNode == null || contentNode == null) {
                    System.out.println("[v0] Skipping invalid file: " + fileNode);
                    continue;
                }
                
                String path = pathNode.asText();
                String content = contentNode.asText();
                
                System.out.println("[v0] Adding file to zip: " + path + " Content length: " + content.length());
                System.out.println("[v0] File content preview: " + content.substring(0, Math.min(200, content.length())));
                
                ZipEntry entry = new ZipEntry(path);
                zos.putNextEntry(entry);
                zos.write(content.getBytes());
                zos.closeEntry();
                filesFound++;
            }
            
            System.out.println("[v0] Total files added to zip: " + filesFound);
            
            if (filesFound == 0) {
                throw new IOException("No files were extracted from OpenAI response");
            }
            
            zos.close();
            byte[] zipBytes = baos.toByteArray();
            System.out.println("[v0] Zip buffer generated, size: " + zipBytes.length + " bytes");
            
            return zipBytes;
            
        } catch (Exception e) {
            throw new IOException("Test generation failed: " + e.getMessage(), e);
        }
    }
}
