package com.goldmansachs.qaagent.controller;

import com.goldmansachs.qaagent.model.JiraTicket;
import com.goldmansachs.qaagent.service.JiraService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jira")
@CrossOrigin(origins = "*")
public class JiraController {
    
    private static final Logger logger = LoggerFactory.getLogger(JiraController.class);
    
    @Autowired
    private JiraService jiraService;
    
    /**
     * Fetch JIRA tickets with configuration
     */
    @PostMapping("/tickets")
    public ResponseEntity<Map<String, Object>> fetchTickets(@RequestBody Map<String, String> jiraConfig) {
        logger.info("Received JIRA ticket fetch request");
        logger.info("Request body: {}", jiraConfig);
        logger.info("Request headers: Content-Type=application/json");
        
        try {
            String url = jiraConfig.get("url");
            String email = jiraConfig.get("email");
            String apiToken = jiraConfig.get("apiToken");
            String projectKey = jiraConfig.get("projectKey");
            
            logger.info("JIRA Configuration - URL: {}, Email: {}, Project: {}", url, email, projectKey);
            
            if (url == null || email == null || apiToken == null || projectKey == null) {
                logger.warn("Missing required JIRA configuration fields");
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", "Missing required JIRA configuration fields"));
            }
            
            List<JiraTicket> tickets = jiraService.fetchTicketsFromJira(url, email, apiToken, projectKey);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "tickets", tickets
            ));
            
        } catch (Exception e) {
            logger.error("Error fetching JIRA tickets: ", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "error", "Failed to fetch tickets from JIRA: " + e.getMessage()));
        }
    }
    
    /**
     * Validate JIRA connection
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateConnection(@RequestBody Map<String, String> jiraConfig) {
        logger.info("Validating JIRA connection");
        logger.info("Request body: {}", jiraConfig);
        logger.info("Request headers: Content-Type=application/json");
        
        try {
            String url = jiraConfig.get("url");
            String email = jiraConfig.get("email");
            String apiToken = jiraConfig.get("apiToken");
            String projectKey = jiraConfig.get("projectKey");
            
            logger.info("Validating JIRA Configuration - URL: {}, Email: {}, Project: {}", url, email, projectKey);
            
            boolean isValid = jiraService.validateJiraConnection(url, email, apiToken, projectKey);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "valid", isValid
            ));
            
        } catch (Exception e) {
            logger.error("Error validating JIRA connection: ", e);
            return ResponseEntity.ok(Map.of(
                "success", false,
                "valid", false,
                "error", e.getMessage()
            ));
        }
    }
}
