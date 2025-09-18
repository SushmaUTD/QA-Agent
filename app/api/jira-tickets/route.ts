import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url, email, apiToken, projectKey } = await request.json()

    if (!url || !email || !apiToken || !projectKey) {
      return NextResponse.json({ error: "Missing required JIRA configuration" }, { status: 400 })
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
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64")

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

  // Look for acceptance criteria patterns
  const patterns = [
    /acceptance criteria:?\s*\n(.*?)(?:\n\n|\n[A-Z]|$)/is,
    /ac:?\s*\n(.*?)(?:\n\n|\n[A-Z]|$)/is,
    /criteria:?\s*\n(.*?)(?:\n\n|\n[A-Z]|$)/is,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1]
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && (line.startsWith("-") || line.startsWith("*") || line.startsWith("•")))
        .map((line) => line.replace(/^[-*•]\s*/, ""))
    }
  }

  // If no specific AC section found, return empty array
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
