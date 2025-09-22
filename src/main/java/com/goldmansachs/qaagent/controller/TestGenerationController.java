package com.goldmansachs.qaagent.controller;

import com.goldmansachs.qaagent.model.TestGenerationRequest;
import com.goldmansachs.qaagent.service.TestGenerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class TestGenerationController {

    private static final Logger logger = LoggerFactory.getLogger(TestGenerationController.class);

    @Autowired
    private TestGenerationService testGenerationService;

    @PostMapping("/generate-tests")
    public ResponseEntity<byte[]> generateTests(@RequestBody TestGenerationRequest request) {
        logger.info("Received test generation request");
        logger.info("Request body: {}", request);
        
        try {
            byte[] zipBytes = testGenerationService.generateTestsAsZip(request);
            logger.info("Test generation completed successfully, zip size: {} bytes", zipBytes.length);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "spring-boot-tests-" + System.currentTimeMillis() + ".zip");
            headers.setContentLength(zipBytes.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(zipBytes);
                    
        } catch (Exception e) {
            logger.error("Test generation failed: {}", e.getMessage(), e);
            String errorJson = "{\"success\":false,\"error\":\"Failed to generate tests: " + e.getMessage().replace("\"", "\\\"") + "\"}";
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorJson.getBytes());
        }
    }
}
