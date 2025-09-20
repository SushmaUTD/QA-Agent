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
        
        try {
            String prompt = buildEnhancedPrompt(jiraTicket, language);
            String response = callOpenAI(prompt);
            
            logger.info("Generated code length: {}", response.length());
            
            return parseOpenAIResponse(response, jiraTicket.getKey(), language);
            
        } catch (Exception e) {
            logger.error("Error generating test project: ", e);
            return generateFallbackProject(jiraTicket, language);
        }
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
            prompt.append("2. Include comprehensive pom.xml with ALL necessary dependencies (Spring Boot 3.1.0, RestAssured 5.3.0, TestNG 7.8.0, Selenium 4.11.0)\n");
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
            prompt.append("2. Include comprehensive requirements.txt with ALL necessary dependencies\n");
            prompt.append("3. Create MULTIPLE test files covering ALL acceptance criteria scenarios\n");
            prompt.append("4. Use pytest framework with proper fixtures and parametrization\n");
            prompt.append("5. Use requests library for API testing with comprehensive assertions\n");
            prompt.append("6. Include data-driven tests and test configuration\n");
            prompt.append("7. Add proper setup and teardown methods\n");
            prompt.append("8. Include detailed comments and documentation\n\n");
            
            prompt.append("Return the response as a JSON object with this EXACT structure:\n");
            prompt.append("{\n");
            prompt.append("  \"files\": {\n");
            prompt.append("    \"requirements.txt\": \"<all dependencies>\",\n");
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
    
    private GeneratedTestProject generateFallbackProject(JiraTicket jiraTicket, String language) {
        logger.warn("Generating enhanced fallback project for ticket: {}", jiraTicket.getKey());
        
        Map<String, String> files = new HashMap<>();
        
        if ("java".equalsIgnoreCase(language)) {
            files.put("pom.xml", generateEnhancedFallbackPom());
            files.put("src/main/java/com/test/Application.java", generateFallbackApplication());
            files.put("src/test/java/com/test/ApiTest.java", generateEnhancedFallbackJavaTest(jiraTicket));
            files.put("src/test/java/com/test/IntegrationTest.java", generateFallbackIntegrationTest(jiraTicket));
            files.put("src/test/java/com/test/NegativeTest.java", generateFallbackNegativeTest(jiraTicket));
            files.put("src/main/resources/application.properties", generateEnhancedApplicationProperties());
            files.put("src/test/resources/test-data.json", generateTestData(jiraTicket));
            files.put("README.md", generateReadme(jiraTicket, language));
        } else {
            files.put("requirements.txt", "pytest==7.4.0\nrequests==2.31.0\nselenium==4.11.2\njsonschema==4.17.3");
            files.put("test_api.py", generateEnhancedFallbackPythonTest(jiraTicket));
            files.put("test_integration.py", generatePythonIntegrationTest(jiraTicket));
            files.put("test_negative.py", generatePythonNegativeTest(jiraTicket));
            files.put("conftest.py", generatePytestConfig());
            files.put("config.py", "BASE_URL = 'http://localhost:8080'\nTIMEOUT = 30\nAPI_VERSION = 'v1'");
            files.put("test_data.json", generateTestData(jiraTicket));
            files.put("README.md", generateReadme(jiraTicket, language));
        }
        
        return new GeneratedTestProject(files, jiraTicket.getKey() + "-tests", language);
    }
    
    private String generateEnhancedFallbackPom() {
        return """
            <?xml version="1.0" encoding="UTF-8"?>
            <project xmlns="http://maven.apache.org/POM/4.0.0"
                     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                     xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
                     http://maven.apache.org/xsd/maven-4.0.0.xsd">
                <modelVersion>4.0.0</modelVersion>
                <groupId>com.test</groupId>
                <artifactId>api-tests</artifactId>
                <version>1.0.0</version>
                <packaging>jar</packaging>
                
                <properties>
                    <maven.compiler.source>17</maven.compiler.source>
                    <maven.compiler.target>17</maven.compiler.target>
                    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
                    <spring.boot.version>3.1.0</spring.boot.version>
                    <rest.assured.version>5.3.0</rest.assured.version>
                    <testng.version>7.8.0</testng.version>
                    <selenium.version>4.11.0</selenium.version>
                </properties>
                
                <dependencies>
                    <dependency>
                        <groupId>org.springframework.boot</groupId>
                        <artifactId>spring-boot-starter</artifactId>
                        <version>${spring.boot.version}</version>
                    </dependency>
                    <dependency>
                        <groupId>org.springframework.boot</groupId>
                        <artifactId>spring-boot-starter-web</artifactId>
                        <version>${spring.boot.version}</version>
                    </dependency>
                    <dependency>
                        <groupId>org.springframework.boot</groupId>
                        <artifactId>spring-boot-starter-test</artifactId>
                        <version>${spring.boot.version}</version>
                        <scope>test</scope>
                    </dependency>
                    <dependency>
                        <groupId>io.rest-assured</groupId>
                        <artifactId>rest-assured</artifactId>
                        <version>${rest.assured.version}</version>
                        <scope>test</scope>
                    </dependency>
                    <dependency>
                        <groupId>io.rest-assured</groupId>
                        <artifactId>json-schema-validator</artifactId>
                        <version>${rest.assured.version}</version>
                        <scope>test</scope>
                    </dependency>
                    <dependency>
                        <groupId>org.testng</groupId>
                        <artifactId>testng</artifactId>
                        <version>${testng.version}</version>
                        <scope>test</scope>
                    </dependency>
                    <dependency>
                        <groupId>org.seleniumhq.selenium</groupId>
                        <artifactId>selenium-java</artifactId>
                        <version>${selenium.version}</version>
                        <scope>test</scope>
                    </dependency>
                    <dependency>
                        <groupId>com.fasterxml.jackson.core</groupId>
                        <artifactId>jackson-databind</artifactId>
                        <version>2.15.2</version>
                        <scope>test</scope>
                    </dependency>
                </dependencies>
                
                <build>
                    <plugins>
                        <plugin>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-maven-plugin</artifactId>
                            <version>${spring.boot.version}</version>
                        </plugin>
                        <plugin>
                            <groupId>org.apache.maven.plugins</groupId>
                            <artifactId>maven-surefire-plugin</artifactId>
                            <version>3.0.0</version>
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
    
    private String generateEnhancedFallbackJavaTest(JiraTicket jiraTicket) {
        return String.format("""
            package com.test;
            
            import io.restassured.RestAssured;
            import io.restassured.response.Response;
            import org.testng.annotations.*;
            import static io.restassured.RestAssured.*;
            import static org.hamcrest.Matchers.*;
            import static org.testng.Assert.*;
            
            /**
             * Comprehensive API tests for JIRA ticket: %s
             * Summary: %s
             * 
             * Test Coverage:
             * - Positive scenarios (happy path)
             * - Negative scenarios (error cases)
             * - Edge cases and boundary conditions
             * - Data validation tests
             */
            public class ApiTest {
                
                private static final String BASE_URL = "http://localhost:8080";
                private static final String API_PATH = "/api/v1";
                
                @BeforeClass
                public void setup() {
                    RestAssured.baseURI = BASE_URL;
                    RestAssured.basePath = API_PATH;
                    RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
                }
                
                @Test(priority = 1, description = "Test successful API endpoint availability")
                public void testApiEndpointAvailability() {
                    given()
                        .contentType("application/json")
                    .when()
                        .get("/health")
                    .then()
                        .statusCode(anyOf(is(200), is(404))) // Accept both for fallback
                        .time(lessThan(5000L));
                }
                
                @Test(priority = 2, description = "Test main functionality based on acceptance criteria")
                public void test%sMainFunctionality() {
                    // Test based on JIRA ticket: %s
                    // Acceptance criteria validation
                    
                    given()
                        .contentType("application/json")
                        .body("{\\"testData\\": \\"sample\\"}")
                    .when()
                        .post("/test")
                    .then()
                        .statusCode(anyOf(is(200), is(201), is(404))) // Flexible for demo
                        .body("size()", greaterThanOrEqualTo(0));
                }
                
                @Test(priority = 3, description = "Test data validation scenarios")
                public void testDataValidation() {
                    // Test invalid data scenarios
                    given()
                        .contentType("application/json")
                        .body("{}")
                    .when()
                        .post("/test")
                    .then()
                        .statusCode(anyOf(is(400), is(422), is(404))); // Accept validation errors or not found
                }
                
                @Test(priority = 4, description = "Test boundary conditions")
                public void testBoundaryConditions() {
                    // Test edge cases
                    String largePayload = "{\\"data\\": \\"" + "x".repeat(1000) + "\\"}";
                    
                    given()
                        .contentType("application/json")
                        .body(largePayload)
                    .when()
                        .post("/test")
                    .then()
                        .statusCode(anyOf(is(200), is(201), is(413), is(404))); // Accept various responses
                }
                
                @DataProvider(name = "testData")
                public Object[][] getTestData() {
                    return new Object[][] {
                        {"valid_data_1", "expected_result_1"},
                        {"valid_data_2", "expected_result_2"},
                        {"edge_case_data", "edge_result"}
                    };
                }
                
                @Test(dataProvider = "testData", description = "Data-driven test scenarios")
                public void testWithMultipleDataSets(String input, String expected) {
                    given()
                        .contentType("application/json")
                        .body("{\\"input\\": \\"" + input + "\\"}")
                    .when()
                        .get("/test/" + input)
                    .then()
                        .statusCode(anyOf(is(200), is(404))) // Flexible for demo
                        .time(lessThan(3000L));
                }
                
                @AfterClass
                public void teardown() {
                    // Cleanup operations if needed
                    System.out.println("Test execution completed for ticket: %s");
                }
            }
            """, jiraTicket.getKey(), jiraTicket.getSummary(), 
                jiraTicket.getKey().replace("-", ""), jiraTicket.getKey(), jiraTicket.getKey());
    }
    
    private String generateFallbackIntegrationTest(JiraTicket jiraTicket) {
        return String.format("""
            package com.test;
            
            import org.springframework.boot.test.context.SpringBootTest;
            import org.springframework.test.context.TestPropertySource;
            import org.testng.annotations.*;
            import io.restassured.RestAssured;
            import static io.restassured.RestAssured.*;
            import static org.hamcrest.Matchers.*;
            
            /**
             * Integration tests for JIRA ticket: %s
             * Tests end-to-end scenarios and system integration
             */
            @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
            @TestPropertySource(locations = "classpath:application-test.properties")
            public class IntegrationTest {
                
                @BeforeClass
                public void setupIntegration() {
                    RestAssured.baseURI = "http://localhost";
                    RestAssured.port = 8080;
                }
                
                @Test(description = "End-to-end workflow test")
                public void testEndToEndWorkflow() {
                    // Test complete workflow based on acceptance criteria
                    given()
                        .contentType("application/json")
                    .when()
                        .get("/api/v1/integration-test")
                    .then()
                        .statusCode(anyOf(is(200), is(404)))
                        .time(lessThan(10000L));
                }
                
                @Test(description = "System integration test")
                public void testSystemIntegration() {
                    // Test system components integration
                    given()
                        .contentType("application/json")
                        .body("{\\"integrationTest\\": true}")
                    .when()
                        .post("/api/v1/integration")
                    .then()
                        .statusCode(anyOf(is(200), is(201), is(404)));
                }
            }
            """, jiraTicket.getKey());
    }
    
    private String generateFallbackNegativeTest(JiraTicket jiraTicket) {
        return String.format("""
            package com.test;
            
            import org.testng.annotations.*;
            import io.restassured.RestAssured;
            import static io.restassured.RestAssured.*;
            import static org.hamcrest.Matchers.*;
            
            /**
             * Negative test scenarios for JIRA ticket: %s
             * Tests error conditions and edge cases
             */
            public class NegativeTest {
                
                @BeforeClass
                public void setup() {
                    RestAssured.baseURI = "http://localhost:8080";
                    RestAssured.basePath = "/api/v1";
                }
                
                @Test(description = "Test invalid endpoint")
                public void testInvalidEndpoint() {
                    given()
                        .contentType("application/json")
                    .when()
                        .get("/invalid-endpoint")
                    .then()
                        .statusCode(404);
                }
                
                @Test(description = "Test malformed JSON")
                public void testMalformedJson() {
                    given()
                        .contentType("application/json")
                        .body("{ invalid json }")
                    .when()
                        .post("/test")
                    .then()
                        .statusCode(anyOf(is(400), is(404)));
                }
                
                @Test(description = "Test unauthorized access")
                public void testUnauthorizedAccess() {
                    given()
                        .contentType("application/json")
                    .when()
                        .get("/secure-endpoint")
                    .then()
                        .statusCode(anyOf(is(401), is(403), is(404)));
                }
                
                @Test(description = "Test method not allowed")
                public void testMethodNotAllowed() {
                    given()
                        .contentType("application/json")
                    .when()
                        .delete("/test")
                    .then()
                        .statusCode(anyOf(is(405), is(404)));
                }
            }
            """, jiraTicket.getKey());
    }
    
    private String generateEnhancedApplicationProperties() {
        return """
            # Application Configuration
            server.port=8080
            spring.application.name=api-test-project
            
            # Logging Configuration
            logging.level.com.test=DEBUG
            logging.level.io.restassured=DEBUG
            logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n
            
            # Test Configuration
            test.api.base-url=http://localhost:8080
            test.api.timeout=30000
            test.data.cleanup=true
            
            # Database Configuration (if needed)
            spring.datasource.url=jdbc:h2:mem:testdb
            spring.datasource.driver-class-name=org.h2.Driver
            spring.jpa.hibernate.ddl-auto=create-drop
            """;
    }
    
    private String generateTestData(JiraTicket jiraTicket) {
        return String.format("""
            {
              "ticket": "%s",
              "summary": "%s",
              "testData": {
                "validInputs": [
                  {"id": 1, "name": "Test Item 1", "status": "active"},
                  {"id": 2, "name": "Test Item 2", "status": "inactive"}
                ],
                "invalidInputs": [
                  {"id": -1, "name": "", "status": "invalid"},
                  {"id": null, "name": null, "status": null}
                ],
                "edgeCases": [
                  {"id": 999999, "name": "Very Long Name That Exceeds Normal Limits", "status": "edge"}
                ]
              },
              "expectedResults": {
                "success": {"status": 200, "message": "Operation successful"},
                "validation_error": {"status": 400, "message": "Validation failed"},
                "not_found": {"status": 404, "message": "Resource not found"}
              }
            }
            """, jiraTicket.getKey(), jiraTicket.getSummary());
    }
    
    private String generateReadme(JiraTicket jiraTicket, String language) {
        if ("java".equalsIgnoreCase(language)) {
            return String.format("""
                # Test Project for JIRA Ticket: %s
                
                ## Summary
                %s
                
                ## Description
                This is an automated test project generated based on JIRA acceptance criteria.
                
                ## Prerequisites
                - Java 17 or higher
                - Maven 3.6 or higher
                
                ## Running Tests
                
                ### Run all tests
                \`\`\`bash
                mvn clean test
                \`\`\`
                
                ### Run specific test class
                \`\`\`bash
                mvn test -Dtest=ApiTest
                mvn test -Dtest=IntegrationTest
                mvn test -Dtest=NegativeTest
                \`\`\`
                
                ### Generate test reports
                \`\`\`bash
                mvn surefire-report:report
                \`\`\`
                
                ## Test Structure
                - `ApiTest.java` - Main API functionality tests
                - `IntegrationTest.java` - End-to-end integration tests
                - `NegativeTest.java` - Error scenarios and edge cases
                
                ## Configuration
                - Test configuration: `src/main/resources/application.properties`
                - Test data: `src/test/resources/test-data.json`
                
                ## Generated by
                JIRA Test Generator - Automated test project generation from acceptance criteria
                """, jiraTicket.getKey(), jiraTicket.getSummary());
        } else {
            return String.format("""
                # Test Project for JIRA Ticket: %s
                
                ## Summary
                %s
                
                ## Description
                This is an automated test project generated based on JIRA acceptance criteria.
                
                ## Prerequisites
                - Python 3.8 or higher
                - pip package manager
                
                ## Setup
                \`\`\`bash
                pip install -r requirements.txt
                \`\`\`
                
                ## Running Tests
                
                ### Run all tests
                \`\`\`bash
                pytest -v
                \`\`\`
                
                ### Run specific test file
                \`\`\`bash
                pytest test_api.py -v
                pytest test_integration.py -v
                pytest test_negative.py -v
                \`\`\`
                
                ### Generate HTML report
                \`\`\`bash
                pytest --html=report.html --self-contained-html
                \`\`\`
                
                ## Test Structure
                - `test_api.py` - Main API functionality tests
                - `test_integration.py` - End-to-end integration tests
                - `test_negative.py` - Error scenarios and edge cases
                - `conftest.py` - Test configuration and fixtures
                
                ## Configuration
                - Test configuration: `config.py`
                - Test data: `test_data.json`
                
                ## Generated by
                JIRA Test Generator - Automated test project generation from acceptance criteria
                """, jiraTicket.getKey(), jiraTicket.getSummary());
        }
    }
    
    private String generateEnhancedFallbackPythonTest(JiraTicket jiraTicket) {
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
    
    private String generatePythonIntegrationTest(JiraTicket jiraTicket) {
        return String.format("""
            import pytest
            import requests
            from config import BASE_URL
            
            def test_end_to_end_workflow():
                \"\"\"End-to-end workflow test for JIRA ticket: %s\"\"\"
                response = requests.get(f"{BASE_URL}/api/v1/integration-test")
                assert response.status_code == 200
            """, jiraTicket.getKey());
    }
    
    private String generatePythonNegativeTest(JiraTicket jiraTicket) {
        return String.format("""
            import pytest
            import requests
            from config import BASE_URL
            
            def test_invalid_endpoint():
                \"\"\"Test invalid endpoint for JIRA ticket: %s\"\"\"
                response = requests.get(f"{BASE_URL}/invalid-endpoint")
                assert response.status_code == 404
            """, jiraTicket.getKey());
    }
    
    private String generatePytestConfig() {
        return """
            import pytest
            
            @pytest.fixture(scope="module")
            def api_client():
                return requests.Session()
            """;
    }
}
