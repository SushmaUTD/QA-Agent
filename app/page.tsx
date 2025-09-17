"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"

export default function JiraTestAI() {
  const [activeTab, setActiveTab] = useState("jira")
  const [jiraUrl, setJiraUrl] = useState("")
  const [email, setEmail] = useState("")
  const [projectKey, setProjectKey] = useState("")
  const [apiToken, setApiToken] = useState("")
  const [testTypes, setTestTypes] = useState({
    functional: true,
    ui: true,
    edgeCase: true,
    performance: false,
    security: false,
  })
  const [coverageLevel, setCoverageLevel] = useState([75])

  const sidebarItems = [
    { id: "test-generator", icon: "🧪", label: "Test Generator", active: true },
    { id: "tickets", icon: "🎫", label: "Tickets" },
    { id: "analytics", icon: "📊", label: "Analytics" },
    { id: "history", icon: "📜", label: "History" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ]

  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">JIRA Test AI</h1>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    item.active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-8">
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold mb-2">Test Generator</h2>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Integration Source</h3>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "jira" ? "default" : "outline"}
                  onClick={() => setActiveTab("jira")}
                  className="flex items-center gap-2"
                >
                  ✓ JIRA Tickets
                </Button>
                <Button
                  variant={activeTab === "github" ? "default" : "outline"}
                  onClick={() => setActiveTab("github")}
                  className="flex items-center gap-2"
                >
                  🔗 GitHub Pull Requests
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jira-url">JIRA URL</Label>
                      <Input
                        id="jira-url"
                        placeholder="https://your-domain.atlassian.net"
                        value={jiraUrl}
                        onChange={(e) => setJiraUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        placeholder="your-email@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-key">Project Key</Label>
                      <Input
                        id="project-key"
                        placeholder="PROJ"
                        value={projectKey}
                        onChange={(e) => setProjectKey(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="api-token">API Token</Label>
                      <Input
                        id="api-token"
                        type="password"
                        placeholder="Your JIRA API token"
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button className="w-full">⚡ Connect to JIRA</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base font-medium mb-4 block">Test Types</Label>
                    <div className="space-y-3">
                      {Object.entries(testTypes).map(([key, checked]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={checked}
                            onCheckedChange={(checked) => setTestTypes((prev) => ({ ...prev, [key]: !!checked }))}
                          />
                          <Label htmlFor={key} className="capitalize">
                            {key === "edgeCase" ? "Edge Case" : key}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-medium">Coverage Level: {coverageLevel[0]}%</Label>
                    </div>
                    <Slider
                      value={coverageLevel}
                      onValueChange={setCoverageLevel}
                      max={100}
                      step={5}
                      className="mb-4"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Basic</span>
                      <span>Standard</span>
                      <span>Comprehensive</span>
                      <span>Exhaustive</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
