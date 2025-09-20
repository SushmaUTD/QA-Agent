package com.example.jiratestgenerator.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class TestGenerationRequest {
    @NotNull
    private JiraTicket jiraTicket;
    
    @NotBlank
    private String language; // "java" or "python"
    
    // Constructors
    public TestGenerationRequest() {}
    
    public TestGenerationRequest(JiraTicket jiraTicket, String language) {
        this.jiraTicket = jiraTicket;
        this.language = language;
    }
    
    // Getters and Setters
    public JiraTicket getJiraTicket() { return jiraTicket; }
    public void setJiraTicket(JiraTicket jiraTicket) { this.jiraTicket = jiraTicket; }
    
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
}
