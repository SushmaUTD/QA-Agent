package com.goldmansachs.qaagent.controller;

import com.goldmansachs.qaagent.model.TestGenerationRequest;
import com.goldmansachs.qaagent.model.TestGenerationResponse;
import com.goldmansachs.qaagent.service.TestGenerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class TestGenerationController {

    @Autowired
    private TestGenerationService testGenerationService;

    @PostMapping("/generate-tests")
    public ResponseEntity<TestGenerationResponse> generateTests(@RequestBody TestGenerationRequest request) {
        try {
            TestGenerationResponse response = testGenerationService.generateTests(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            TestGenerationResponse errorResponse = new TestGenerationResponse();
            errorResponse.setError("Failed to generate tests: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}
