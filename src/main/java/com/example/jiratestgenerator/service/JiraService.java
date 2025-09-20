package com.example.jiratestgenerator.service;

import com.example.jiratestgenerator.model.JiraTicket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class JiraService {
    
    private static final Logger logger = LoggerFactory.getLogger(JiraService.class);
    
    /**
     * Get sample JIRA tickets for demonstration
     * In a real implementation, this would connect to JIRA API
     */
    public List<JiraTicket> getSampleTickets() {
        logger.info("Fetching sample JIRA tickets");
        
        return Arrays.asList(
            new JiraTicket(
                "KAN-1",
                "Create Instrument API",
                "**Acceptance Criteria:**\n\n" +
                "**AC1: Create Instrument Endpoint**\n" +
                "- **Given** a valid instrument request\n" +
                "- **When** POST /api/instruments is called\n" +
                "- **Then** the instrument should be created successfully\n" +
                "- **And** return HTTP 201 status\n" +
                "- **And** return the created instrument with ID\n\n" +
                "**Request Body Example:**\n" +
                "```json\n" +
                "{\n" +
                "  \"symbol\": \"AAPL\",\n" +
                "  \"name\": \"Apple Inc.\",\n" +
                "  \"type\": \"STOCK\",\n" +
                "  \"exchange\": \"NASDAQ\"\n" +
                "}\n" +
                "```\n\n" +
                "**Response Example:**\n" +
                "```json\n" +
                "{\n" +
                "  \"id\": 1,\n" +
                "  \"symbol\": \"AAPL\",\n" +
                "  \"name\": \"Apple Inc.\",\n" +
                "  \"type\": \"STOCK\",\n" +
                "  \"exchange\": \"NASDAQ\",\n" +
                "  \"createdAt\": \"2024-01-15T10:30:00Z\"\n" +
                "}\n" +
                "```\n\n" +
                "**AC2: Validation**\n" +
                "- **Given** an invalid request (missing required fields)\n" +
                "- **When** POST /api/instruments is called\n" +
                "- **Then** return HTTP 400 status\n" +
                "- **And** return validation error messages\n\n" +
                "**AC3: Duplicate Symbol**\n" +
                "- **Given** an instrument with existing symbol\n" +
                "- **When** POST /api/instruments is called\n" +
                "- **Then** return HTTP 409 status\n" +
                "- **And** return conflict error message",
                "To Do",
                "High",
                "john.doe@example.com"
            ),
            new JiraTicket(
                "KAN-2",
                "Get Instrument by ID API",
                "**Acceptance Criteria:**\n\n" +
                "**AC1: Get Instrument by Valid ID**\n" +
                "- **Given** a valid instrument ID\n" +
                "- **When** GET /api/instruments/{id} is called\n" +
                "- **Then** return HTTP 200 status\n" +
                "- **And** return the instrument details\n\n" +
                "**AC2: Get Instrument by Invalid ID**\n" +
                "- **Given** an invalid instrument ID\n" +
                "- **When** GET /api/instruments/{id} is called\n" +
                "- **Then** return HTTP 404 status\n" +
                "- **And** return not found error message",
                "In Progress",
                "Medium",
                "jane.smith@example.com"
            ),
            new JiraTicket(
                "KAN-3",
                "Update Instrument API",
                "**Acceptance Criteria:**\n\n" +
                "**AC1: Update Instrument**\n" +
                "- **Given** a valid instrument ID and update request\n" +
                "- **When** PUT /api/instruments/{id} is called\n" +
                "- **Then** return HTTP 200 status\n" +
                "- **And** return the updated instrument\n\n" +
                "**Request Body Example:**\n" +
                "```json\n" +
                "{\n" +
                "  \"name\": \"Apple Inc. Updated\",\n" +
                "  \"type\": \"STOCK\",\n" +
                "  \"exchange\": \"NASDAQ\"\n" +
                "}\n" +
                "```\n\n" +
                "**AC2: Update Non-existent Instrument**\n" +
                "- **Given** an invalid instrument ID\n" +
                "- **When** PUT /api/instruments/{id} is called\n" +
                "- **Then** return HTTP 404 status",
                "Done",
                "Low",
                "bob.wilson@example.com"
            )
        );
    }
    
    /**
     * Get a specific JIRA ticket by key
     */
    public JiraTicket getTicketByKey(String key) {
        logger.info("Fetching JIRA ticket with key: {}", key);
        
        return getSampleTickets().stream()
            .filter(ticket -> ticket.getKey().equals(key))
            .findFirst()
            .orElse(null);
    }
    
    /**
     * In a real implementation, this would authenticate with JIRA
     * and fetch tickets using JIRA REST API
     */
    public boolean validateJiraConnection() {
        logger.info("Validating JIRA connection");
        // For demo purposes, always return true
        return true;
    }
}
