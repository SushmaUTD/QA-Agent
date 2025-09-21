package com.goldmansachs.qaagent.model;

import java.util.List;

public class AIConfig {
    private String testType;
    private int coverage;
    private String downloadFormat;
    private List<String> testCaseTypes;

    // Getters and Setters
    public String getTestType() { return testType; }
    public void setTestType(String testType) { this.testType = testType; }

    public int getCoverage() { return coverage; }
    public void setCoverage(int coverage) { this.coverage = coverage; }

    public String getDownloadFormat() { return downloadFormat; }
    public void setDownloadFormat(String downloadFormat) { this.downloadFormat = downloadFormat; }

    public List<String> getTestCaseTypes() { return testCaseTypes; }
    public void setTestCaseTypes(List<String> testCaseTypes) { this.testCaseTypes = testCaseTypes; }
}
