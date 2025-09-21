package com.goldmansachs.qaagent.model;

import java.util.List;

public class TestGenerationRequest {
    private List<JiraTicket> tickets;
    private AIConfig aiConfig;
    private String language;
    private AppConfig appConfig;

    // Getters and Setters
    public List<JiraTicket> getTickets() { return tickets; }
    public void setTickets(List<JiraTicket> tickets) { this.tickets = tickets; }

    public AIConfig getAiConfig() { return aiConfig; }
    public void setAiConfig(AIConfig aiConfig) { this.aiConfig = aiConfig; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public AppConfig getAppConfig() { return appConfig; }
    public void setAppConfig(AppConfig appConfig) { this.appConfig = appConfig; }
}
