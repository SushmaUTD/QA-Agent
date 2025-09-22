package com.example.jiratestgenerator.service;

import com.example.jiratestgenerator.model.JiraTicket;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

@Service
public class JiraService {
    
    private static final Logger logger = LoggerFactory.getLogger(JiraService.class);
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    
    public JiraService() {
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Fetch tickets from JIRA using REST API
     */
    public List<JiraTicket> fetchTicketsFromJira(String url, String email, String apiToken, String projectKey) throws Exception {
        logger.info("Fetching tickets from JIRA for project: {}", projectKey);
        
        String baseUrl = url.replaceAll("/$", "");
        String jiraApiUrl = baseUrl + "/rest/api/3/search";
        String jql = "project=" + projectKey + " ORDER BY updated DESC";
        String auth = Base64.getEncoder().encodeToString((email + ":" + apiToken).getBytes());
        
        logger.info("Making JIRA API call to: {}", jiraApiUrl);
        logger.info("JQL Query: {}", jql);
        logger.info("Authorization header: Basic [REDACTED]");
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(jiraApiUrl + "?jql=" + jql + "&fields=id,key,summary,description,status,priority,customfield_*&maxResults=50"))
            .header("Authorization", "Basic " + auth)
            .header("Accept", "application/json")
            .header("Content-Type", "application/json")
            .GET()
            .build();
        
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        logger.info("JIRA Response status: {}", response.statusCode());
        logger.info("JIRA Response headers: {}", response.headers().map());
        
        if (response.statusCode() != 200) {
            logger.error("JIRA API error: {} - {}", response.statusCode(), response.body());
            throw new RuntimeException("JIRA API error (" + response.statusCode() + "): " + response.body());
        }
        
        JsonNode jsonResponse = objectMapper.readTree(response.body());
        JsonNode issues = jsonResponse.get("issues");
        
        List<JiraTicket> tickets = new ArrayList<>();
        
        if (issues != null && issues.isArray()) {
            for (JsonNode issue : issues) {
                JiraTicket ticket = new JiraTicket();
                ticket.setId(issue.get("id").asText());
                ticket.setKey(issue.get("key").asText());
                ticket.setSummary(issue.get("fields").get("summary").asText());
                
                // Extract description
                JsonNode descriptionNode = issue.get("fields").get("description");
                String description = extractDescription(descriptionNode);
                ticket.setDescription(description);
                
                // Extract acceptance criteria
                List<String> acceptanceCriteria = extractAcceptanceCriteria(description);
                ticket.setAcceptanceCriteria(acceptanceCriteria);
                
                ticket.setStatus(issue.get("fields").get("status").get("name").asText());
                
                JsonNode priorityNode = issue.get("fields").get("priority");
                ticket.setPriority(priorityNode != null ? priorityNode.get("name").asText() : "Medium");
                
                JsonNode assigneeNode = issue.get("fields").get("assignee");
                ticket.setAssignee(assigneeNode != null ? 
                    (assigneeNode.get("emailAddress") != null ? assigneeNode.get("emailAddress").asText() : 
                     assigneeNode.get("displayName").asText()) : "Unassigned");
                
                tickets.add(ticket);
            }
        }
        
        logger.info("Successfully fetched {} tickets from JIRA", tickets.size());
        return tickets;
    }
    
    /**
     * Extract description from Atlassian Document Format or plain text
     */
    private String extractDescription(JsonNode descriptionNode) {
        if (descriptionNode == null || descriptionNode.isNull()) {
            return "No description available";
        }
        
        if (descriptionNode.isTextual()) {
            return descriptionNode.asText();
        }
        
        // Handle Atlassian Document Format
        if (descriptionNode.has("content")) {
            StringBuilder description = new StringBuilder();
            extractTextFromADF(descriptionNode, description);
            return description.toString();
        }
        
        return descriptionNode.toString();
    }
    
    /**
     * Extract text from Atlassian Document Format recursively
     */
    private void extractTextFromADF(JsonNode node, StringBuilder text) {
        if (node.has("type") && "text".equals(node.get("type").asText())) {
            text.append(node.get("text").asText());
        } else if (node.has("content")) {
            for (JsonNode child : node.get("content")) {
                extractTextFromADF(child, text);
            }
            if ("paragraph".equals(node.get("type").asText()) || "heading".equals(node.get("type").asText())) {
                text.append("\n");
            }
        }
    }
    
    /**
     * Extract acceptance criteria from description
     */
    private List<String> extractAcceptanceCriteria(String description) {
        List<String> criteria = new ArrayList<>();
        
        if (description == null || description.isEmpty()) {
            return criteria;
        }
        
        // Look for acceptance criteria patterns
        String[] patterns = {
            "(?i)acceptance criteria:?\\s*\\n(.*?)(?:\\n\\n|\\n[A-Z]|$)",
            "(?i)ac:?\\s*\\n(.*?)(?:\\n\\n|\\n[A-Z]|$)",
            "(?i)criteria:?\\s*\\n(.*?)(?:\\n\\n|\\n[A-Z]|$)"
        };
        
        for (String pattern : patterns) {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern, java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher m = p.matcher(description);
            
            if (m.find()) {
                String[] lines = m.group(1).split("\n");
                for (String line : lines) {
                    line = line.trim();
                    if (!line.isEmpty() && (line.startsWith("-") || line.startsWith("*") || line.startsWith("•"))) {
                        criteria.add(line.replaceFirst("^[-*•]\\s*", ""));
                    }
                }
                break;
            }
        }
        
        // If no specific AC section found, return empty list
        return criteria;
    }
    
    /**
     * Validate JIRA connection
     */
    public boolean validateJiraConnection(String url, String email, String apiToken, String projectKey) {
        logger.info("Validating JIRA connection for project: {}", projectKey);
        
        try {
            String baseUrl = url.replaceAll("/$", "");
            String projectsUrl = baseUrl + "/rest/api/3/project";
            String auth = Base64.getEncoder().encodeToString((email + ":" + apiToken).getBytes());
            
            logger.info("Validating JIRA connection to: {}", projectsUrl);
            logger.info("Authorization header: Basic [REDACTED]");
            
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(projectsUrl))
                .header("Authorization", "Basic " + auth)
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .GET()
                .build();
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            logger.info("JIRA Validation response status: {}", response.statusCode());
            
            if (response.statusCode() == 200) {
                JsonNode projects = objectMapper.readTree(response.body());
                
                // Check if the specified project exists
                for (JsonNode project : projects) {
                    if (projectKey.equals(project.get("key").asText())) {
                        logger.info("JIRA connection validated successfully for project: {}", projectKey);
                        return true;
                    }
                }
                
                logger.warn("Project {} not found in JIRA", projectKey);
                return false;
            } else {
                logger.error("JIRA validation failed with status: {} - {}", response.statusCode(), response.body());
                return false;
            }
            
        } catch (Exception e) {
            logger.error("Error validating JIRA connection: ", e);
            return false;
        }
    }
    
    /**
     * Get sample JIRA tickets for demonstration (kept for backward compatibility)
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
}
