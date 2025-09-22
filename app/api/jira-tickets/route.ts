import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { url, email, apiToken, projectKey } = requestBody

    console.log("[v0] JIRA API Request Body:", JSON.stringify(requestBody, null, 2))
    console.log("[v0] JIRA API Request Headers:", Object.fromEntries(request.headers.entries()))

    if (!url || !email || !apiToken || !projectKey) {
      return NextResponse.json({ error: "Missing required JIRA configuration" }, { status: 400 })
    }

    const projectsUrl = `${url}/rest/api/3/project`
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64")

    console.log("[v0] Calling JIRA Projects API:", projectsUrl)
    console.log("[v0] JIRA Auth Header:", `Basic ${auth.substring(0, 10)}...`)

    const projectsResponse = await fetch(projectsUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!projectsResponse.ok) {
      const errorText = await projectsResponse.text()
      console.error("JIRA Projects API Error:", projectsResponse.status, errorText)
      return NextResponse.json(
        { error: `Failed to connect to JIRA. Please check your credentials and URL.` },
        { status: projectsResponse.status },
      )
    }

    const projects = await projectsResponse.json()
    const projectExists = projects.some((project: any) => project.key === projectKey)

    if (!projectExists) {
      const availableProjects = projects.map((p: any) => `${p.key} (${p.name})`).join(", ")
      return NextResponse.json(
        {
          error: `Project "${projectKey}" not found. Available projects: ${availableProjects}`,
          availableProjects: projects.map((p: any) => ({ key: p.key, name: p.name })),
        },
        { status: 400 },
      )
    }

    // Create the JIRA API URL for searching issues
    const jiraApiUrl = `${url}/rest/api/3/search`

    const jql = `project = ${projectKey} ORDER BY updated DESC`

    const searchParams = new URLSearchParams({
      jql,
      fields: "summary,description,status,assignee,priority,updated,customfield_*",
      maxResults: "50",
    })

    // Create Basic Auth header
    const response = await fetch(`${jiraApiUrl}?${searchParams}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("JIRA API Error:", response.status, errorText)
      return NextResponse.json(
        { error: `JIRA API Error: ${response.status} - ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Transform JIRA issues to our format
    const tickets = data.issues.map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description:
        issue.fields.description?.content?.[0]?.content?.[0]?.text ||
        issue.fields.description ||
        "No description available",
      status: issue.fields.status.name,
      assignee: issue.fields.assignee?.emailAddress || issue.fields.assignee?.displayName || "Unassigned",
      priority: issue.fields.priority?.name || "Medium",
      updated: issue.fields.updated.split("T")[0],
      acceptanceCriteria: extractAcceptanceCriteria(issue.fields.description),
    }))

    return NextResponse.json({ success: true, tickets })
  } catch (error) {
    console.error("Error fetching JIRA tickets:", error)
    return NextResponse.json({ error: "Failed to fetch JIRA tickets" }, { status: 500 })
  }
}

// Helper function to extract acceptance criteria from description
function extractAcceptanceCriteria(description: any): string[] {
  if (!description) return []

  let text = ""
  if (typeof description === "string") {
    text = description
  } else if (description.content) {
    // Handle Atlassian Document Format
    text = extractTextFromADF(description)
  }

  console.log("[v0] Raw description for AC extraction:", JSON.stringify(description, null, 2))
  console.log("[v0] Extracted text for AC extraction:", text)

  const patterns = [
    // Standard format: "Acceptance Criteria:" followed by content
    /acceptance criteria:?\s*\n(.*?)(?:\n\n|\n[A-Z][^:]*:|$)/is,
    // Short format: "AC:" followed by content
    /\bac:?\s*\n(.*?)(?:\n\n|\n[A-Z][^:]*:|$)/is,
    // Just "Criteria:" followed by content
    /\bcriteria:?\s*\n(.*?)(?:\n\n|\n[A-Z][^:]*:|$)/is,
    // Acceptance criteria anywhere in text
    /acceptance criteria:?\s*(.*?)(?:\n\n|\n[A-Z][^:]*:|$)/is,
    // Look for bullet points after "Acceptance Criteria" even without colon
    /acceptance criteria\s*(.*?)(?:\n\n|\n[A-Z][^:]*:|$)/is,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      console.log("[v0] Found AC match with pattern:", pattern.source)
      console.log("[v0] AC match content:", match[1])

      const criteria = match[1]
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
          // Remove bullet points and clean up
          return line.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "")
        })
        .filter((line) => line.length > 0)

      console.log("[v0] Extracted criteria:", criteria)
      return criteria
    }
  }

  const simpleMatch = text.match(/acceptance criteria:?\s*(.*)/is)
  if (simpleMatch && simpleMatch[1] && simpleMatch[1].trim()) {
    console.log("[v0] Using simple AC extraction:", simpleMatch[1])
    return [simpleMatch[1].trim()]
  }

  console.log("[v0] No acceptance criteria found in text")
  return []
}

// Helper function to extract text from Atlassian Document Format
function extractTextFromADF(adf: any): string {
  if (!adf || !adf.content) return ""

  let text = ""

  function traverse(node: any) {
    if (node.type === "text") {
      text += node.text
    } else if (node.content) {
      node.content.forEach(traverse)
    }

    if (node.type === "paragraph" || node.type === "heading") {
      text += "\n"
    }
  }

  adf.content.forEach(traverse)
  return text
}
