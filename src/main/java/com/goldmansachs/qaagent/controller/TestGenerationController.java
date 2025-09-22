package com.goldmansachs.qaagent.controller;

import com.goldmansachs.qaagent.model.TestGenerationRequest;
import com.goldmansachs.qaagent.model.TestGenerationResponse;
import com.goldmansachs.qaagent.service.TestGenerationService;
import org.springframework.beans.factory.annotation.Autowired;
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
    public ResponseEntity<TestGenerationResponse> generateTests(@RequestBody TestGenerationRequest request) {
        logger.info("Received test generation request");
        logger.info("Request body: {}", request);
        
        try {
            TestGenerationResponse response = testGenerationService.generateTests(request);
            logger.info("Test generation completed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Test generation failed: {}", e.getMessage(), e);
            TestGenerationResponse errorResponse = new TestGenerationResponse();
            errorResponse.setError("Failed to generate tests: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}
