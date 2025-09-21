import { type NextRequest, NextResponse } from "next/server"

interface JiraConfig {
  url: string
  email: string
  apiToken: string
  projectKey: string
}

interface JiraTicket {
  id: string
  key: string
  summary: string
  description: string
  status: string
  priority: string
  acceptanceCriteria: string[]
}

export async function POST(request: NextRequest) {
  try {
    const jiraConfig: JiraConfig = await request.json()

    const auth = Buffer.from(`${jiraConfig.email}:${jiraConfig.apiToken}`).toString("base64")

    const jiraResponse = await fetch(
      `${jiraConfig.url}/rest/api/3/search?jql=project=${jiraConfig.projectKey}&fields=id,key,summary,description,status,priority,customfield_*&maxResults=50`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    )

    if (!jiraResponse.ok) {
      throw new Error(`JIRA API responded with status: ${jiraResponse.status}`)
    }

    const jiraData = await jiraResponse.json()

    const tickets: JiraTicket[] = jiraData.issues.map((issue: any) => {
      // Extract acceptance criteria from description or custom fields
      let acceptanceCriteria: string[] = []

      // Try to extract acceptance criteria from description
      if (issue.fields.description?.content) {
        const description = issue.fields.description.content
          .map((block: any) => block.content?.map((item: any) => item.text).join(" ") || "")
          .join("\n")

        // Look for acceptance criteria patterns
        const acMatch = description.match(/acceptance criteria:?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is)
        if (acMatch) {
          acceptanceCriteria = acMatch[1]
            .split(/\n|•|-|\*/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        }
      }

      // If no AC found in description, try custom fields
      if (acceptanceCriteria.length === 0) {
        Object.keys(issue.fields).forEach((key) => {
          if (key.startsWith("customfield_") && issue.fields[key]) {
            const fieldValue =
              typeof issue.fields[key] === "string" ? issue.fields[key] : JSON.stringify(issue.fields[key])

            if (
              fieldValue.toLowerCase().includes("acceptance") ||
              fieldValue.toLowerCase().includes("criteria") ||
              fieldValue.toLowerCase().includes("api") ||
              fieldValue.toLowerCase().includes("endpoint")
            ) {
              acceptanceCriteria.push(fieldValue)
            }
          }
        })
      }

      // Fallback: use description as acceptance criteria if nothing else found
      if (acceptanceCriteria.length === 0 && issue.fields.description?.content) {
        const description = issue.fields.description.content
          .map((block: any) => block.content?.map((item: any) => item.text).join(" ") || "")
          .join("\n")
        acceptanceCriteria = [description]
      }

      return {
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        description:
          issue.fields.description?.content
            ?.map((block: any) => block.content?.map((item: any) => item.text).join(" ") || "")
            .join("\n") || "",
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name || "Medium",
        acceptanceCriteria: acceptanceCriteria,
      }
    })

    return NextResponse.json({
      success: true,
      tickets: tickets,
    })
  } catch (error) {
    console.error("JIRA API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch tickets from JIRA: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
