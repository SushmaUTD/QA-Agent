package com.example.jiratestgenerator.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.ArrayList;

public class JiraTicket {
    private String id;
    private String key;
    private String summary;
    private String description;
    private String status;
    private String priority;
    private String assignee;
    private List<String> acceptanceCriteria;
    
    // Constructors
    public JiraTicket() {
        this.acceptanceCriteria = new ArrayList<>();
    }
    
    public JiraTicket(String key, String summary, String description, String status, String priority, String assignee) {
        this.key = key;
        this.summary = summary;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.assignee = assignee;
        this.acceptanceCriteria = new ArrayList<>();
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    
    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }
    
    public List<String> getAcceptanceCriteria() { return acceptanceCriteria; }
    public void setAcceptanceCriteria(List<String> acceptanceCriteria) { this.acceptanceCriteria = acceptanceCriteria; }
}
