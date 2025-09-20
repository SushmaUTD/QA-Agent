package com.example.jiratestgenerator.controller;

import com.example.jiratestgenerator.model.GeneratedTestProject;
import com.example.jiratestgenerator.model.JiraTicket;
import com.example.jiratestgenerator.model.TestGenerationRequest;
import com.example.jiratestgenerator.service.OpenAIService;
import com.example.jiratestgenerator.service.FileService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test-generation")
@CrossOrigin(origins = "*")
public class TestGenerationController {
    
    private static final Logger logger = LoggerFactory.getLogger(TestGenerationController.class);
    
    @Autowired
    private OpenAIService openAIService;
    
    @Autowired
    private FileService fileService;
    
    /**
     * Generate test project based on JIRA ticket
     */
    @PostMapping("/generate")
    public ResponseEntity<GeneratedTestProject> generateTests(@Valid @RequestBody TestGenerationRequest request) {
        logger.info("Generating tests for JIRA ticket: {} in language: {}", 
                   request.getJiraTicket().getKey(), request.getLanguage());
        
        try {
            GeneratedTestProject project = openAIService.generateTestProject(
                request.getJiraTicket(), 
                request.getLanguage()
            );
            
            return ResponseEntity.ok(project);
            
        } catch (Exception e) {
            logger.error("Error generating tests: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Download generated test project as ZIP
     */
    @PostMapping("/download")
    public ResponseEntity<ByteArrayResource> downloadTestProject(@Valid @RequestBody TestGenerationRequest request) {
        logger.info("Downloading test project for JIRA ticket: {} in language: {}", 
                   request.getJiraTicket().getKey(), request.getLanguage());
        
        try {
            // Generate the test project
            GeneratedTestProject project = openAIService.generateTestProject(
                request.getJiraTicket(), 
                request.getLanguage()
            );
            
            // Create ZIP file
            byte[] zipBytes = fileService.createZipFile(project);
            ByteArrayResource resource = new ByteArrayResource(zipBytes);
            
            String filename = project.getProjectName() + ".zip";
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(zipBytes.length)
                .body(resource);
                
        } catch (Exception e) {
            logger.error("Error downloading test project: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Test Generation Service is running");
    }
}
