package com.example.jiratestgenerator.service;

import com.example.jiratestgenerator.model.GeneratedTestProject;
import org.apache.commons.compress.archivers.zip.ZipArchiveEntry;
import org.apache.commons.compress.archivers.zip.ZipArchiveOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class FileService {
    
    private static final Logger logger = LoggerFactory.getLogger(FileService.class);
    
    /**
     * Create a ZIP file from the generated test project
     */
    public byte[] createZipFile(GeneratedTestProject project) throws IOException {
        logger.info("Creating ZIP file for project: {}", project.getProjectName());
        
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipArchiveOutputStream zipOut = new ZipArchiveOutputStream(baos)) {
            
            // Set ZIP file properties
            zipOut.setEncoding(StandardCharsets.UTF_8.name());
            zipOut.setCreateUnicodeExtraFields(ZipArchiveOutputStream.UnicodeExtraFieldPolicy.ALWAYS);
            
            // Add each file to the ZIP
            for (Map.Entry<String, String> fileEntry : project.getFiles().entrySet()) {
                String fileName = fileEntry.getKey();
                String fileContent = fileEntry.getValue();
                
                logger.debug("Adding file to ZIP: {}", fileName);
                
                // Create ZIP entry
                ZipArchiveEntry entry = new ZipArchiveEntry(fileName);
                entry.setSize(fileContent.getBytes(StandardCharsets.UTF_8).length);
                zipOut.putArchiveEntry(entry);
                
                // Write file content
                zipOut.write(fileContent.getBytes(StandardCharsets.UTF_8));
                zipOut.closeArchiveEntry();
            }
            
            // Add README file
            addReadmeFile(zipOut, project);
            
            zipOut.finish();
            
            byte[] zipBytes = baos.toByteArray();
            logger.info("ZIP file created successfully. Size: {} bytes", zipBytes.length);
            
            return zipBytes;
            
        } catch (IOException e) {
            logger.error("Error creating ZIP file: ", e);
            throw e;
        }
    }
    
    /**
     * Add a README file to the ZIP with instructions
     */
    private void addReadmeFile(ZipArchiveOutputStream zipOut, GeneratedTestProject project) throws IOException {
        String readmeContent = generateReadmeContent(project);
        
        ZipArchiveEntry readmeEntry = new ZipArchiveEntry("README.md");
        readmeEntry.setSize(readmeContent.getBytes(StandardCharsets.UTF_8).length);
        zipOut.putArchiveEntry(readmeEntry);
        zipOut.write(readmeContent.getBytes(StandardCharsets.UTF_8));
        zipOut.closeArchiveEntry();
    }
    
    /**
     * Generate README content based on the project language
     */
    private String generateReadmeContent(GeneratedTestProject project) {
        StringBuilder readme = new StringBuilder();
        
        readme.append("# ").append(project.getProjectName()).append("\n\n");
        readme.append("Generated API test project based on JIRA acceptance criteria.\n\n");
        
        if ("java".equalsIgnoreCase(project.getLanguage())) {
            readme.append("## Java Project Setup\n\n");
            readme.append("This is a Maven-based Spring Boot project with RestAssured tests.\n\n");
            readme.append("### Prerequisites\n");
            readme.append("- Java 17 or higher\n");
            readme.append("- Maven 3.6 or higher\n\n");
            readme.append("### Running the Tests\n\n");
            readme.append("1. Navigate to the project directory\n");
            readme.append("2. Run the following commands:\n\n");
            readme.append("```bash\n");
            readme.append("# Compile the project\n");
            readme.append("mvn clean compile\n\n");
            readme.append("# Run the tests\n");
            readme.append("mvn test\n");
            readme.append("```\n\n");
            readme.append("### Dependencies Included\n");
            readme.append("- Spring Boot Starter Test\n");
            readme.append("- RestAssured for API testing\n");
            readme.append("- TestNG for test framework\n");
            readme.append("- Jackson for JSON processing\n\n");
            
        } else if ("python".equalsIgnoreCase(project.getLanguage())) {
            readme.append("## Python Project Setup\n\n");
            readme.append("This is a Python project with pytest and requests for API testing.\n\n");
            readme.append("### Prerequisites\n");
            readme.append("- Python 3.8 or higher\n");
            readme.append("- pip package manager\n\n");
            readme.append("### Running the Tests\n\n");
            readme.append("1. Navigate to the project directory\n");
            readme.append("2. Run the following commands:\n\n");
            readme.append("```bash\n");
            readme.append("# Install dependencies\n");
            readme.append("pip install -r requirements.txt\n\n");
            readme.append("# Run the tests\n");
            readme.append("pytest -v\n");
            readme.append("```\n\n");
            readme.append("### Dependencies Included\n");
            readme.append("- pytest for testing framework\n");
            readme.append("- requests for HTTP requests\n");
            readme.append("- selenium for web automation (if needed)\n\n");
        }
        
        readme.append("### Configuration\n\n");
        readme.append("Update the configuration files with your actual API endpoints and credentials:\n");
        
        if ("java".equalsIgnoreCase(project.getLanguage())) {
            readme.append("- `src/main/resources/application.properties`\n\n");
        } else {
            readme.append("- `config.py`\n\n");
        }
        
        readme.append("### Test Structure\n\n");
        readme.append("The tests are organized based on the JIRA acceptance criteria:\n");
        readme.append("- Each acceptance criterion is mapped to specific test methods\n");
        readme.append("- API endpoints are tested with various scenarios (success, validation, error cases)\n");
        readme.append("- Proper assertions are included for status codes and response validation\n\n");
        
        readme.append("### Notes\n\n");
        readme.append("- Make sure your API server is running before executing the tests\n");
        readme.append("- Update base URLs and endpoints according to your environment\n");
        readme.append("- Add authentication headers if required by your API\n");
        
        return readme.toString();
    }
    
    /**
     * Validate file content before adding to ZIP
     */
    private boolean isValidFileContent(String content) {
        return content != null && !content.trim().isEmpty();
    }
    
    /**
     * Sanitize file name for ZIP entry
     */
    private String sanitizeFileName(String fileName) {
        // Remove any path traversal attempts and invalid characters
        return fileName.replaceAll("\\.\\.", "")
                      .replaceAll("[<>:\"|?*]", "_")
                      .trim();
    }
}
