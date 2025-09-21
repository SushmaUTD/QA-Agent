package com.goldmansachs.qaagent.model;

import java.util.List;

public class TestGenerationResponse {
    private List<GeneratedFile> files;
    private boolean success;
    private String error;

    // Getters and Setters
    public List<GeneratedFile> getFiles() { return files; }
    public void setFiles(List<GeneratedFile> files) { this.files = files; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
