package com.example.jiratestgenerator.model;

import java.util.Map;

public class GeneratedTestProject {
    private Map<String, String> files; // filename -> content
    private String projectName;
    private String language;
    
    // Constructors
    public GeneratedTestProject() {}
    
    public GeneratedTestProject(Map<String, String> files, String projectName, String language) {
        this.files = files;
        this.projectName = projectName;
        this.language = language;
    }
    
    // Getters and Setters
    public Map<String, String> getFiles() { return files; }
    public void setFiles(Map<String, String> files) { this.files = files; }
    
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
}
