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
            
            List<ProjectFile> files = extractFilesWithJsonParsing(generatedContent);
            
            if (files.isEmpty()) {
                throw new IOException("No files were extracted from OpenAI response");
            }
            
            // Create zip file in memory
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ZipOutputStream zos = new ZipOutputStream(baos);
            
            Set<String> addedPaths = new HashSet<>();
            
            for (ProjectFile file : files) {
                if (addedPaths.contains(file.getPath())) {
                    System.out.println("[v0] Skipping duplicate file: " + file.getPath());
                    continue;
                }
                
                System.out.println("[v0] Adding file to zip: " + file.getPath() + " Content length: " + file.getContent().length());
                System.out.println("[v0] File content preview: " + file.getContent().substring(0, Math.min(200, file.getContent().length())));
                
                ZipEntry entry = new ZipEntry(file.getPath());
                zos.putNextEntry(entry);
                zos.write(file.getContent().getBytes());
                zos.closeEntry();
                
                addedPaths.add(file.getPath());
            }
            
            System.out.println("[v0] Total files added to zip: " + addedPaths.size());
            
            zos.close();
            byte[] zipBytes = baos.toByteArray();
            System.out.println("[v0] Zip buffer generated, size: " + zipBytes.length + " bytes");
            
            return zipBytes;
            
        } catch (Exception e) {
            throw new IOException("Test generation failed: " + e.getMessage(), e);
        }
    }
    
    private List<ProjectFile> extractFilesDirectly(String response) {
        List<ProjectFile> files = new ArrayList<>();
        
        // Find all file entries using simple string patterns
        String[] lines = response.split("\n");
        String currentPath = null;
        StringBuilder currentContent = new StringBuilder();
        boolean inContent = false;
        
        for (String line : lines) {
            // Look for path pattern: "path": "some/path"
            if (line.contains("\"path\":")) {
                // Save previous file if exists
                if (currentPath != null && currentContent.length() > 0) {
                    String content = currentContent.toString().trim();
                    // Clean up the content by removing quotes and unescaping
                    if (content.startsWith("\"") && content.endsWith("\"")) {
                        content = content.substring(1, content.length() - 1);
                    }
                    content = content.replace("\\\\n", "\n")
                                   .replace("\\\\t", "\t")
                                   .replace("\\\\\"", "\"")
                                   .replace("\\\\\\\\", "\\");
                    
                    files.add(new ProjectFile(currentPath, content));
                    System.out.println("[v0] Extracted file: " + currentPath + " (length: " + content.length() + ")");
                }
                
                // Extract new path
                int pathStart = line.indexOf("\"path\":") + 7;
                int firstQuote = line.indexOf("\"", pathStart);
                int lastQuote = line.indexOf("\"", firstQuote + 1);
                if (firstQuote != -1 && lastQuote != -1) {
                    currentPath = line.substring(firstQuote + 1, lastQuote);
                    currentContent = new StringBuilder();
                    inContent = false;
                }
            }
            // Look for content pattern: "content": "..."
            else if (line.contains("\"content\":") && currentPath != null) {
                inContent = true;
                int contentStart = line.indexOf("\"content\":") + 10;
                String contentPart = line.substring(contentStart).trim();
                if (contentPart.startsWith("\"")) {
                    contentPart = contentPart.substring(1);
                }
                currentContent.append(contentPart);
            }
            // Continue collecting content lines
            else if (inContent && currentPath != null) {
                // Stop if we hit the end of this file entry
                if (line.trim().equals("}") || line.trim().equals("},")) {
                    inContent = false;
                } else {
                    currentContent.append("\n").append(line);
                }
            }
        }
        
        // Don't forget the last file
        if (currentPath != null && currentContent.length() > 0) {
            String content = currentContent.toString().trim();
            if (content.startsWith("\"") && content.endsWith("\"")) {
                content = content.substring(1, content.length() - 1);
            }
            content = content.replace("\\\\n", "\n")
                           .replace("\\\\t", "\t")
                           .replace("\\\\\"", "\"")
                           .replace("\\\\\\\\", "\\");
            
            files.add(new ProjectFile(currentPath, content));
            System.out.println("[v0] Extracted final file: " + currentPath + " (length: " + content.length() + ")");
        }
        
        return files;
    }
    
    private List<ProjectFile> extractFilesWithJsonParsing(String response) {
        List<ProjectFile> files = new ArrayList<>();
        
        try {
            // Extract JSON from response using the same approach as Next.js
            int jsonStart = response.indexOf("{");
            int jsonEnd = response.lastIndexOf("}") + 1;
            
            if (jsonStart == -1 || jsonEnd <= jsonStart) {
                System.out.println("[v0] No JSON found in response");
                return files;
            }
            
            String jsonContent = response.substring(jsonStart, jsonEnd);
            System.out.println("[v0] Extracted JSON length: " + jsonContent.length());
            
            // Parse JSON using ObjectMapper
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(jsonContent);
            JsonNode filesArray = rootNode.get("files");
            
            if (filesArray != null && filesArray.isArray()) {
                for (JsonNode fileNode : filesArray) {
                    String path = fileNode.get("path").asText();
                    String content = fileNode.get("content").asText();
                    
                    // The content is already properly unescaped by Jackson
                    files.add(new ProjectFile(path, content));
                    System.out.println("[v0] Parsed file: " + path + " (length: " + content.length() + ")");
                }
            }
            
        } catch (Exception e) {
            System.out.println("[v0] JSON parsing failed: " + e.getMessage());
            e.printStackTrace();
            // Fallback to direct extraction if JSON parsing fails
            return extractFilesDirectly(response);
        }
        
        return files;
    }

    public void testParsingWithActualResponse() {
        String actualResponse = "{\n\"files\": [\n{\n\"path\": \"src/main/java/com/example/Application.java\",\n\"content\": \"package com.example;\\n\\nimport org.springframework.boot.SpringApplication;\\nimport org.springframework.boot.autoconfigure.SpringBootApplication;\\n\\n@SpringBootApplication\\npublic class Application {\\n    public static void main(String[] args) {\\n        SpringApplication.run(Application.class, args);\\n    }\\n}\"\n},\n{\n\"path\": \"src/test/java/com/example/BaseTest.java\",\n\"content\": \"package com.example;\\n\\nimport io.restassured.RestAssured;\\nimport io.restassured.builder.RequestSpecBuilder;\\nimport io.restassured.config.HttpClientConfig;\\nimport io.restassured.config.RestAssuredConfig;\\nimport io.restassured.filter.log.LogDetail;\\nimport io.restassured.filter.log.RequestLoggingFilter;\\nimport io.restassured.filter.log.ResponseLoggingFilter;\\nimport io.restassured.http.ContentType;\\nimport io.restassured.response.Response;\\nimport io.restassured.specification.RequestSpecification;\\nimport org.testng.annotations.AfterClass;\\nimport org.testng.annotations.BeforeClass;\\nimport org.testng.asserts.SoftAssert;\\n\\nimport java.io.IOException;\\nimport java.io.InputStream;\\nimport java.time.Duration;\\nimport java.util.List;\\nimport java.util.Map;\\nimport java.util.Objects;\\nimport java.util.Optional;\\nimport java.util.Properties;\\n\\nimport static io.restassured.RestAssured.given;\\n\\n/**\\n * Base test providing:\\n *  - Property loading from application-test.properties\\n *  - RestAssured global configuration & request specification\\n *  - Common API helpers and soft assertions\\n */\\npublic abstract class BaseTest {\\n\\n    protected Properties properties;\\n    protected RequestSpecification req;\\n    protected SoftAssert softly;\\n\\n    @BeforeClass\\n    public void globalSetUp() {\\n        properties = loadProps();\\n\\n        final String baseUrl = Objects.requireNonNull(properties.getProperty(\\\"base.url\\\"), \\\"base.url property is required\\\");\\n        final int connectTimeoutMs = Integer.parseInt(properties.getProperty(\\\"http.connectTimeoutMs\\\", \\\"10000\\\"));\\n        final int socketTimeoutMs = Integer.parseInt(properties.getProperty(\\\"http.socketTimeoutMs\\\", \\\"20000\\\"));\\n        final boolean enableHttpLogging = Boolean.parseBoolean(properties.getProperty(\\\"http.logging\\\", \\\"true\\\"));\\n\\n        RestAssured.baseURI = baseUrl;\\n        RestAssured.useRelaxedHTTPSValidation();\\n        RestAssured.config = RestAssuredConfig.config().httpClient(HttpClientConfig.httpClientConfig().setParam(\\\"http.connection.timeout\\\", connectTimeoutMs).setParam(\\\"http.socket.timeout\\\", socketTimeoutMs));\\n\\n        req = new RequestSpecBuilder()\\n                .setContentType(ContentType.JSON)\\n                .setAccept(ContentType.JSON)\\n                .build();\\n\\n        if (enableHttpLogging) {\\n            req = req.filter(new RequestLoggingFilter(LogDetail.ALL))\\n                     .filter(new ResponseLoggingFilter(LogDetail.ALL));\\n        }\\n\\n        softly = new SoftAssert();\\n    }\\n\\n    @AfterClass\\n    public void globalTearDown() {\\n        softly.assertAll();\\n    }\\n\\n    private Properties loadProps() {\\n        Properties props = new Properties();\\n        try (InputStream is = getClass().getClassLoader().getResourceAsStream(\\\"application-test.properties\\\")) {\\n            if (is != null) {\\n                props.load(is);\\n            }\\n        } catch (IOException e) {\\n            throw new RuntimeException(\\\"Failed to load test properties\\\", e);\\n        }\\n        return props;\\n    }\\n\\n    protected Response makeRequest(String method, String endpoint, Object body) {\\n        switch (method.toUpperCase()) {\\n            case \\\"GET\\\":\\n                return given(req).when().get(endpoint);\\n            case \\\"POST\\\":\\n                return given(req).body(body).when().post(endpoint);\\n            case \\\"PUT\\\":\\n                return given(req).body(body).when().put(endpoint);\\n            case \\\"DELETE\\\":\\n                return given(req).when().delete(endpoint);\\n            default:\\n                throw new IllegalArgumentException(\\\"Unsupported HTTP method: \\\" + method);\\n        }\\n    }\\n\\n    protected void waitForCondition(java.util.function.Supplier<Boolean> condition, Duration timeout, String description) {\\n        long start = System.currentTimeMillis();\\n        while (!condition.get() && (System.currentTimeMillis() - start) < timeout.toMillis()) {\\n            try {\\n                Thread.sleep(100);\\n            } catch (InterruptedException e) {\\n                Thread.currentThread().interrupt();\\n                throw new RuntimeException(\\\"Interrupted while waiting for: \\\" + description, e);\\n            }\\n        }\\n        if (!condition.get()) {\\n            throw new RuntimeException(\\\"Timeout waiting for: \\\" + description);\\n        }\\n    }\\n}\"\n}]\n}";
        
        System.out.println("[v0] Testing parsing with actual OpenAI response...");
        List<ProjectFile> files = extractFilesWithJsonParsing(actualResponse);
        System.out.println("[v0] Parsed " + files.size() + " files successfully");
        
        for (ProjectFile file : files) {
            System.out.println("[v0] File: " + file.getPath() + " (length: " + file.getContent().length() + ")");
            System.out.println("[v0] Content preview: " + file.getContent().substring(0, Math.min(100, file.getContent().length())));
        }
    }

    private static class ProjectFile {
        private final String path;
        private final String content;
        
        public ProjectFile(String path, String content) {
            this.path = path;
            this.content = content;
        }
        
        public String getPath() { return path; }
        public String getContent() { return content; }
    }
}
