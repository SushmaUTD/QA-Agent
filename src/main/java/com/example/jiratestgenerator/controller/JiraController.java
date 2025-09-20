package com.example.jiratestgenerator.controller;

import com.example.jiratestgenerator.model.JiraTicket;
import com.example.jiratestgenerator.service.JiraService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jira")
@CrossOrigin(origins = "*")
public class JiraController {
    
    private static final Logger logger = LoggerFactory.getLogger(JiraController.class);
    
    @Autowired
    private JiraService jiraService;
    
    /**
     * Get all JIRA tickets
     */
    @GetMapping("/tickets")
    public ResponseEntity<List<JiraTicket>> getAllTickets() {
        logger.info("Fetching all JIRA tickets");
        
        try {
            List<JiraTicket> tickets = jiraService.getSampleTickets();
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            logger.error("Error fetching JIRA tickets: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get a specific JIRA ticket by key
     */
    @GetMapping("/tickets/{key}")
    public ResponseEntity<JiraTicket> getTicketByKey(@PathVariable String key) {
        logger.info("Fetching JIRA ticket with key: {}", key);
        
        try {
            JiraTicket ticket = jiraService.getTicketByKey(key);
            if (ticket != null) {
                return ResponseEntity.ok(ticket);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error fetching JIRA ticket {}: ", key, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Validate JIRA connection
     */
    @GetMapping("/validate")
    public ResponseEntity<Boolean> validateConnection() {
        logger.info("Validating JIRA connection");
        
        try {
            boolean isValid = jiraService.validateJiraConnection();
            return ResponseEntity.ok(isValid);
        } catch (Exception e) {
            logger.error("Error validating JIRA connection: ", e);
            return ResponseEntity.ok(false);
        }
    }
}
