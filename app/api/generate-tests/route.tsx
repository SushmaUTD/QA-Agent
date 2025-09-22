import { type NextRequest, NextResponse } from "next/server"
import JSZip from "jszip"

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { tickets, aiConfig, language, jiraConfig, appConfig } = requestBody

    console.log("[v0] Generating tests for tickets:", tickets?.length || 0)
    console.log("[v0] Download format:", aiConfig?.downloadFormat || "spring-project")

    const hasApiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== ""

    if (!hasApiKey) {
      return NextResponse.json({
        success: false,
        error: "OpenAI API key not configured",
      })
    }

    const ticketDetails = tickets
      .map(
        (ticket: any) =>
          `**JIRA Ticket:** ${ticket.key} - ${ticket.summary}
**Description:** ${ticket.description}
**Acceptance Criteria:**
${ticket.acceptanceCriteria.map((ac: string) => `- ${ac}`).join("\n")}
**Status:** ${ticket.status}
**Priority:** ${ticket.priority}
**Labels:** ${ticket.labels?.join(", ") || "None"}
**Components:** ${ticket.components?.join(", ") || "None"}
**Epic:** ${ticket.epic || "None"}
**Story Points:** ${ticket.storyPoints || "Not estimated"}`,
      )
      .join("\n\n---\n\n")

    let prompt: string
    let filename: string

    if (aiConfig?.downloadFormat === "single-file") {
      prompt = `Generate a single comprehensive Java test class file for API testing based on these JIRA tickets.

**APPLICATION CONTEXT:**
- Base URL: ${appConfig?.baseUrl || "http://localhost:8080"}
- Environment: ${appConfig?.environment || "dev"}
- Auth Details: ${appConfig?.authDetails || "Basic Auth"}

**JIRA TICKETS:**
${ticketDetails}

**REQUIREMENTS:**
1. **Single Java Test Class** - Complete test class with all necessary imports
2. **RestAssured Framework** - Use RestAssured for API testing
3. **TestNG Annotations** - Use @Test, @BeforeClass, @DataProvider as needed
4. **Comprehensive Test Cases** - Both positive and negative tests for each acceptance criteria
5. **Ready to Use** - Can be added directly to an existing Spring Boot project

**IMPORTANT: Respond with ONLY a JSON object in this exact format:**
{
  "files": [
    {
      "path": "ApiTest.java",
      "content": "package com.example;\\n\\nimport io.restassured.RestAssured;\\nimport io.restassured.http.ContentType;\\nimport org.testng.annotations.*;\\nimport static io.restassured.RestAssured.*;\\nimport static org.hamcrest.Matchers.*;\\n\\npublic class ApiTest {\\n\\n    @BeforeClass\\n    public void setup() {\\n        RestAssured.baseURI = \\"${appConfig?.baseUrl || "http://localhost:8080"}\\";\\n    }\\n\\n    // FULL TEST METHODS HERE...\\n}"
    }
  ]
}

Generate a complete, production-ready test class. Do NOT include any markdown formatting, explanations, or text outside the JSON object.`
      filename = `api-tests-${Date.now()}.java`
    } else {
      prompt = `Generate a complete Spring Boot Maven project for API testing based on these JIRA tickets.

**APPLICATION CONTEXT:**
- Base URL: ${appConfig?.baseUrl || "http://localhost:8080"}
- Environment: ${appConfig?.environment || "dev"}
- Auth Details: ${appConfig?.authDetails || "Basic Auth"}

**JIRA TICKETS:**
${ticketDetails}

**REQUIREMENTS:**
1. **Complete POM.XML** with Spring Boot 3.2.0, RestAssured 5.3.2, TestNG 7.8.0, JUnit 5.10.0, Maven Surefire Plugin
2. **Comprehensive Test Classes** - Separate test classes for each major functionality
3. **Test Configuration** - application.properties for test environment
4. **Base Test Class** - Common setup and utilities
5. **Data Providers** - Test data management
6. **Complete Project Structure** - Ready to execute with "mvn test"
7. **Detailed README** - Setup and execution instructions

**IMPORTANT: Respond with ONLY a JSON object in this exact format:**
{
  "files": [
    {
      "path": "pom.xml",
      "content": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<project xmlns=\\"http://maven.apache.org/POM/4.0.0\\" xmlns:xsi=\\"http://www.w3.org/2001/XMLSchema-instance\\"\\n         xsi:schemaLocation=\\"http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd\\">\\n    <modelVersion>4.0.0</modelVersion>\\n    <groupId>com.example</groupId>\\n    <artifactId>api-testing</artifactId>\\n    <version>1.0-SNAPSHOT</version>\\n    <properties>\\n        <maven.compiler.source>17</maven.compiler.source>\\n        <maven.compiler.target>17</maven.compiler.target>\\n        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>\\n        <spring.boot.version>3.2.0</spring.boot.version>\\n        <rest.assured.version>5.3.2</rest.assured.version>\\n        <testng.version>7.8.0</testng.version>\\n    </properties>\\n    <dependencies>\\n        <dependency>\\n            <groupId>org.springframework.boot</groupId>\\n            <artifactId>spring-boot-starter-test</artifactId>\\n            <version>\${spring.boot.version}</version>\\n            <scope>test</scope>\\n        </dependency>\\n        <dependency>\\n            <groupId>io.rest-assured</groupId>\\n            <artifactId>rest-assured</artifactId>\\n            <version>\${rest.assured.version}</version>\\n            <scope>test</scope>\\n        </dependency>\\n        <dependency>\\n            <groupId>org.testng</groupId>\\n            <artifactId>testng</artifactId>\\n            <version>\${testng.version}</version>\\n            <scope>test</scope>\\n        </dependency>\\n        <dependency>\\n            <groupId>com.fasterxml.jackson.core</groupId>\\n            <artifactId>jackson-databind</artifactId>\\n            <version>2.15.2</version>\\n            <scope>test</scope>\\n        </dependency>\\n    </dependencies>\\n    <build>\\n        <plugins>\\n            <plugin>\\n                <groupId>org.apache.maven.plugins</groupId>\\n                <artifactId>maven-surefire-plugin</artifactId>\\n                <version>3.0.0</version>\\n                <configuration>\\n                    <suiteXmlFiles>\\n                        <suiteXmlFile>src/test/resources/testng.xml</suiteXmlFile>\\n                    </suiteXmlFiles>\\n                </configuration>\\n            </plugin>\\n        </plugins>\\n    </build>\\n</project>"
    },
    {
      "path": "src/main/java/com/example/Application.java",
      "content": "package com.example;\\n\\nimport org.springframework.boot.SpringApplication;\\nimport org.springframework.boot.autoconfigure.SpringBootApplication;\\n\\n@SpringBootApplication\\npublic class Application {\\n    public static void main(String[] args) {\\n        SpringApplication.run(Application.class, args);\\n    }\\n}"
    },
    {
      "path": "src/test/java/com/example/BaseTest.java",
      "content": "GENERATE COMPREHENSIVE BASE TEST CLASS WITH SETUP AND UTILITIES"
    },
    {
      "path": "src/test/java/com/example/ApiTest.java", 
      "content": "GENERATE COMPREHENSIVE API TEST CLASS WITH ALL ACCEPTANCE CRITERIA COVERED"
    },
    {
      "path": "src/test/java/com/example/DataProviders.java",
      "content": "GENERATE TEST DATA PROVIDERS CLASS"
    },
    {
      "path": "src/test/resources/application-test.properties",
      "content": "GENERATE TEST CONFIGURATION PROPERTIES"
    },
    {
      "path": "src/test/resources/testng.xml",
      "content": "GENERATE TESTNG SUITE CONFIGURATION"
    },
    {
      "path": "README.md",
      "content": "GENERATE COMPREHENSIVE README WITH SETUP AND EXECUTION INSTRUCTIONS"
    }
  ]
}

Generate ALL files with complete, production-ready content. Each file should be substantial and fully functional. Do NOT include any markdown formatting, explanations, or text outside the JSON object.`
      filename = `spring-boot-tests-${Date.now()}.zip`
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiConfig?.model || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a Spring Boot test automation expert. Generate complete, production-ready test projects as text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: aiConfig?.temperature || 0.1,
        max_tokens: aiConfig?.maxTokens || 4000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const generatedContent = data.choices[0].message.content

    console.log("[v0] OpenAI response length:", generatedContent.length)
    console.log("[v0] OpenAI response preview:", generatedContent.substring(0, 500))

    let parsedResponse
    try {
      const jsonStart = generatedContent.indexOf("{")
      const jsonEnd = generatedContent.lastIndexOf("}") + 1
      const jsonContent = generatedContent.slice(jsonStart, jsonEnd)

      console.log("[v0] Extracted JSON content:", jsonContent.substring(0, 200))

      parsedResponse = JSON.parse(jsonContent)
    } catch (error) {
      console.error("[v0] Failed to parse JSON response:", error)
      return NextResponse.json({
        success: false,
        error: "Failed to parse OpenAI response as JSON",
      })
    }

    if (!parsedResponse.files || !Array.isArray(parsedResponse.files)) {
      return NextResponse.json({
        success: false,
        error: "Invalid response format - missing files array",
      })
    }

    if (aiConfig?.downloadFormat === "single-file") {
      const file = parsedResponse.files[0]
      if (!file || !file.content) {
        return NextResponse.json({
          success: false,
          error: "No test file generated",
        })
      }

      console.log("[v0] Returning single file:", file.path, "Content length:", file.content.length)

      return new NextResponse(file.content, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="${file.path}"`,
          "Content-Length": file.content.length.toString(),
        },
      })
    }

    const zip = new JSZip()
    let filesFound = 0
    for (const file of parsedResponse.files) {
      if (!file.path || !file.content) {
        console.warn("[v0] Skipping invalid file:", file)
        continue
      }

      console.log("[v0] Adding file to zip:", file.path, "Content length:", file.content.length)
      console.log("[v0] File content preview:", file.content.substring(0, 200))

      zip.file(file.path, file.content)
      filesFound++
    }

    console.log("[v0] Total files added to zip:", filesFound)

    if (filesFound === 0) {
      return NextResponse.json({
        success: false,
        error: "No files were extracted from OpenAI response",
      })
    }

    console.log("[v0] Generating zip buffer...")
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6,
      },
    })

    console.log("[v0] Zip buffer generated, size:", zipBuffer.length, "bytes")

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Test generation error:", error.message || error)
    return NextResponse.json({
      success: false,
      error: `Test generation failed: ${error.message || "Unknown error"}`,
    })
  }
}
