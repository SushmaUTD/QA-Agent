package com.goldmansachs.qaagent.service;

import com.goldmansachs.qaagent.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
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
            
            List<FileContent> files = extractFilesFromResponse(generatedContent);
            
            // Create zip file in memory
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ZipOutputStream zos = new ZipOutputStream(baos);
            
            // Add each file to the zip
            for (FileContent file : files) {
                ZipEntry entry = new ZipEntry(file.getPath());
                zos.putNextEntry(entry);
                zos.write(file.getContent().getBytes());
                zos.closeEntry();
            }
            
            zos.close();
            return baos.toByteArray();
            
        } catch (Exception e) {
            throw new IOException("Test generation failed: " + e.getMessage(), e);
        }
    }

    private List<FileContent> extractFilesFromResponse(String response) {
        List<FileContent> files = new ArrayList<>();
        
        // Look for file patterns in the response
        String[] lines = response.split("\n");
        String currentPath = null;
        StringBuilder currentContent = new StringBuilder();
        boolean inContent = false;
        
        for (String line : lines) {
            // Look for path indicators
            if (line.contains("\"path\":") || line.contains("path:")) {
                // Save previous file if exists
                if (currentPath != null && currentContent.length() > 0) {
                    files.add(new FileContent(currentPath, currentContent.toString().trim()));
                }
                
                // Extract new path
                currentPath = extractPath(line);
                currentContent = new StringBuilder();
                inContent = false;
            }
            // Look for content indicators
            else if (line.contains("\"content\":") || line.contains("content:")) {
                inContent = true;
                String contentStart = extractContentStart(line);
                if (!contentStart.isEmpty()) {
                    currentContent.append(contentStart).append("\n");
                }
            }
            // Collect content lines
            else if (inContent && currentPath != null) {
                // Stop if we hit another file or end of JSON
                if (line.trim().equals("}") || line.contains("\"path\":")) {
                    inContent = false;
                    continue;
                }
                currentContent.append(line).append("\n");
            }
        }
        
        // Add the last file
        if (currentPath != null && currentContent.length() > 0) {
            files.add(new FileContent(currentPath, currentContent.toString().trim()));
        }
        
        return files;
    }
    
    private String extractPath(String line) {
        // Extract path from various formats
        int start = line.indexOf("\"") + 1;
        if (start > 0) {
            int end = line.indexOf("\"", start);
            if (end > start) {
                return line.substring(start, end);
            }
        }
        return "src/test/java/GeneratedTest.java"; // fallback
    }
    
    private String extractContentStart(String line) {
        // Extract any content that starts on the same line
        int colonIndex = line.indexOf(":");
        if (colonIndex != -1) {
            String content = line.substring(colonIndex + 1).trim();
            if (content.startsWith("\"")) {
                content = content.substring(1);
            }
            return content;
        }
        return "";
    }
    
    private static class FileContent {
        private final String path;
        private final String content;
        
        public FileContent(String path, String content) {
            this.path = path;
            this.content = content;
        }
        
        public String getPath() { return path; }
        public String getContent() { return content; }
    }

    // private String extractJsonFromResponse(String response) - REMOVED
    // private String fixJsonEscaping(String jsonContent) - REMOVED
}
