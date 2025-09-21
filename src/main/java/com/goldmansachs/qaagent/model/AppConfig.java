package com.goldmansachs.qaagent.model;

public class AppConfig {
    private String baseUrl;
    private String environment;
    private String authDetails;
    private String dbConnectionInfo;

    // Getters and Setters
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }

    public String getAuthDetails() { return authDetails; }
    public void setAuthDetails(String authDetails) { this.authDetails = authDetails; }

    public String getDbConnectionInfo() { return dbConnectionInfo; }
    public void setDbConnectionInfo(String dbConnectionInfo) { this.dbConnectionInfo = dbConnectionInfo; }
}
