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
            
            // Generate tests using OpenAI
            String generatedContent = openAIService.generateTests(prompt);
            
            // Parse and structure the response
            List<GeneratedFile> files = parseGeneratedContent(generatedContent, request);
            
            TestGenerationResponse response = new TestGenerationResponse();
            response.setFiles(files);
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
        
        // Detailed Instructions for OpenAI
        prompt.append("=== GENERATION INSTRUCTIONS ===\n");
        prompt.append("1. ANALYZE each acceptance criteria deeply for:\n");
        prompt.append("   - Exact API endpoints and HTTP methods\n");
        prompt.append("   - Request/response payload structures\n");
        prompt.append("   - Business logic requirements\n");
        prompt.append("   - Edge cases and error scenarios\n\n");
        
        prompt.append("2. GENERATE comprehensive test classes with:\n");
        prompt.append("   - Proper Spring Boot test annotations (@SpringBootTest, @AutoConfigureTestDatabase, etc.)\n");
        prompt.append("   - RestTemplate or WebTestClient for API testing\n");
        prompt.append("   - Realistic test data based on acceptance criteria payloads\n");
        prompt.append("   - Proper assertions for expected responses\n");
        prompt.append("   - Exception handling tests\n");
        prompt.append("   - Integration tests for database operations if applicable\n\n");
        
        prompt.append("3. INCLUDE proper Maven dependencies and configuration:\n");
        prompt.append("   - Generate updated pom.xml with specific versions\n");
        prompt.append("   - Include application.properties for test configuration\n");
        prompt.append("   - Add test utility classes if needed\n\n");
        
        prompt.append("4. ENSURE production-ready quality:\n");
        prompt.append("   - Follow Spring Boot testing best practices\n");
        prompt.append("   - Use proper test naming conventions\n");
        prompt.append("   - Include setup and teardown methods\n");
        prompt.append("   - Add comprehensive logging and error handling\n\n");
        
        prompt.append("Generate a complete Spring Boot test project structure with all necessary files.");
        
        return prompt.toString();
    }

    private List<GeneratedFile> parseGeneratedContent(String content, TestGenerationRequest request) {
        List<GeneratedFile> files = new ArrayList<>();
        
        // This is a simplified parser - in production, you'd want more sophisticated parsing
        // For now, we'll create some standard files based on the request
        
        // Generate pom.xml with proper versions
        GeneratedFile pomFile = new GeneratedFile();
        pomFile.setPath("pom.xml");
        pomFile.setContent(generatePomXml());
        files.add(pomFile);
        
        // Generate application.properties
        GeneratedFile propsFile = new GeneratedFile();
        propsFile.setPath("src/test/resources/application-test.properties");
        propsFile.setContent(generateTestProperties(request));
        files.add(propsFile);
        
        // Generate test classes based on tickets
        for (JiraTicket ticket : request.getTickets()) {
            GeneratedFile testFile = new GeneratedFile();
            testFile.setPath("src/test/java/com/goldmansachs/qaagent/test/" + 
                           ticket.getKey().replace("-", "") + "Test.java");
            testFile.setContent(generateTestClass(ticket, request));
            files.add(testFile);
        }
        
        // Add the actual OpenAI generated content as additional files
        if (content != null && !content.isEmpty()) {
            GeneratedFile aiGeneratedFile = new GeneratedFile();
            aiGeneratedFile.setPath("AI_GENERATED_TESTS.md");
            aiGeneratedFile.setContent(content);
            files.add(aiGeneratedFile);
        }
        
        return files;
    }

    private String generatePomXml() {
        return """
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.goldmansachs</groupId>
    <artifactId>qa-agent-tests</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <name>QA Agent Generated Tests</name>
    <description>Auto-generated test cases from JIRA tickets</description>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    
    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <selenium.version>4.15.0</selenium.version>
        <testng.version>7.8.0</testng.version>
        <rest-assured.version>5.3.2</rest-assured.version>
    </properties>
    
    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        
        <!-- Testing Dependencies -->
        <dependency>
            <groupId>org.testng</groupId>
            <artifactId>testng</artifactId>
            <version>${testng.version}</version>
            <scope>test</scope>
        </dependency>
        
        <!-- Selenium WebDriver -->
        <dependency>
            <groupId>org.seleniumhq.selenium</groupId>
            <artifactId>selenium-java</artifactId>
            <version>${selenium.version}</version>
            <scope>test</scope>
        </dependency>
        
        <dependency>
            <groupId>org.seleniumhq.selenium</groupId>
            <artifactId>selenium-chrome-driver</artifactId>
            <version>${selenium.version}</version>
            <scope>test</scope>
        </dependency>
        
        <!-- REST Assured for API Testing -->
        <dependency>
            <groupId>io.rest-assured</groupId>
            <artifactId>rest-assured</artifactId>
            <version>${rest-assured.version}</version>
            <scope>test</scope>
        </dependency>
        
        <!-- JSON Processing -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>
        
        <!-- Database Testing -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>
        
        <!-- Logging -->
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-classic</artifactId>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.2.2</version>
                <configuration>
                    <suiteXmlFiles>
                        <suiteXmlFile>src/test/resources/testng.xml</suiteXmlFile>
                    </suiteXmlFiles>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
                """;
    }

    private String generateTestProperties(TestGenerationRequest request) {
        StringBuilder props = new StringBuilder();
        props.append("# Test Configuration\n");
        props.append("spring.profiles.active=test\n");
        props.append("logging.level.com.goldmansachs.qaagent=DEBUG\n\n");
        
        if (request.getAppConfig() != null) {
            props.append("# Application Under Test\n");
            props.append("app.base.url=").append(request.getAppConfig().getBaseUrl()).append("\n");
            props.append("app.environment=").append(request.getAppConfig().getEnvironment()).append("\n");
            
            if (request.getAppConfig().getAuthDetails() != null && !request.getAppConfig().getAuthDetails().isEmpty()) {
                props.append("app.auth.details=").append(request.getAppConfig().getAuthDetails()).append("\n");
            }
        }
        
        props.append("\n# Database Configuration\n");
        props.append("spring.datasource.url=jdbc:h2:mem:testdb\n");
        props.append("spring.datasource.driver-class-name=org.h2.Driver\n");
        props.append("spring.jpa.hibernate.ddl-auto=create-drop\n");
        
        return props.toString();
    }

    private String generateTestClass(JiraTicket ticket, TestGenerationRequest request) {
        StringBuilder testClass = new StringBuilder();
        String className = ticket.getKey().replace("-", "") + "Test";
        
        testClass.append("package com.goldmansachs.qaagent.test;\n\n");
        testClass.append("import org.springframework.boot.test.context.SpringBootTest;\n");
        testClass.append("import org.springframework.test.context.TestPropertySource;\n");
        testClass.append("import org.testng.annotations.*;\n");
        testClass.append("import io.restassured.RestAssured;\n");
        testClass.append("import io.restassured.response.Response;\n");
        testClass.append("import static io.restassured.RestAssured.*;\n");
        testClass.append("import static org.hamcrest.Matchers.*;\n\n");
        
        testClass.append("/**\n");
        testClass.append(" * Auto-generated test class for JIRA ticket: ").append(ticket.getKey()).append("\n");
        testClass.append(" * Summary: ").append(ticket.getSummary()).append("\n");
        testClass.append(" * Priority: ").append(ticket.getPriority()).append("\n");
        testClass.append(" * Generated by QA Agent Platform\n");
        testClass.append(" */\n");
        testClass.append("@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)\n");
        testClass.append("@TestPropertySource(locations = \"classpath:application-test.properties\")\n");
        testClass.append("public class ").append(className).append(" {\n\n");
        
        testClass.append("    private String baseUrl;\n\n");
        
        testClass.append("    @BeforeClass\n");
        testClass.append("    public void setUp() {\n");
        if (request.getAppConfig() != null && request.getAppConfig().getBaseUrl() != null) {
            testClass.append("        baseUrl = \"").append(request.getAppConfig().getBaseUrl()).append("\";\n");
        } else {
            testClass.append("        baseUrl = \"http://localhost:8080\";\n");
        }
        testClass.append("        RestAssured.baseURI = baseUrl;\n");
        testClass.append("    }\n\n");
        
        // Generate test methods based on acceptance criteria
        if (ticket.getAcceptanceCriteria() != null && !ticket.getAcceptanceCriteria().isEmpty()) {
            int testMethodCount = 1;
            for (String criteria : ticket.getAcceptanceCriteria()) {
                testClass.append("    @Test\n");
                testClass.append("    public void test").append(ticket.getKey().replace("-", ""))
                         .append("_Scenario").append(testMethodCount).append("() {\n");
                testClass.append("        // Test for: ").append(criteria).append("\n");
                testClass.append("        // TODO: Implement test logic based on acceptance criteria\n");
                testClass.append("        \n");
                testClass.append("        Response response = given()\n");
                testClass.append("            .contentType(\"application/json\")\n");
                testClass.append("            .when()\n");
                testClass.append("            .get(\"/api/test-endpoint\")\n");
                testClass.append("            .then()\n");
                testClass.append("            .statusCode(200)\n");
                testClass.append("            .extract().response();\n");
                testClass.append("            \n");
                testClass.append("        // Add specific assertions based on acceptance criteria\n");
                testClass.append("    }\n\n");
                testMethodCount++;
            }
        } else {
            // Generate a basic test if no acceptance criteria
            testClass.append("    @Test\n");
            testClass.append("    public void test").append(ticket.getKey().replace("-", "")).append("_BasicFunctionality() {\n");
            testClass.append("        // Basic test for ticket: ").append(ticket.getSummary()).append("\n");
            testClass.append("        // TODO: Implement test logic\n");
            testClass.append("    }\n\n");
        }
        
        testClass.append("    @AfterClass\n");
        testClass.append("    public void tearDown() {\n");
        testClass.append("        // Cleanup after tests\n");
        testClass.append("    }\n");
        testClass.append("}\n");
        
        return testClass.toString();
    }
}
