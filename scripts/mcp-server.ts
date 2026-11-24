import { ALL_MCP_TOOLS, executeMcpToolCall } from "../lib/mcp/mcp-tools-catalog"

interface JsonRpcRequest {
  jsonrpc: "2.0"
  id?: string | number
  method: string
  params?: any
}

interface JsonRpcResponse {
  jsonrpc: "2.0"
  id?: string | number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

const TOOLS = ALL_MCP_TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  inputSchema: t.inputSchema,
}))

async function handleCallTool(name: string, args: any) {
  const userId = process.env.CAREER_AGENT_USER_ID || "default-user"
  const result = await executeMcpToolCall(name, args, { userId })

  // If result contains base64Data for a PDF, include both text metadata and binary blob
  if (result && Array.isArray(result.content)) {
    for (const item of result.content) {
      if (item.type === "text" && item.text) {
        try {
          const parsed = JSON.parse(item.text)
          if (parsed.base64Data && typeof parsed.base64Data === "string") {
            const rawBase64 = parsed.base64Data.replace(/^data:[^;]+;base64,/, "")
            return {
              content: [
                item,
                {
                  type: "blob",
                  data: rawBase64,
                  mimeType: "application/pdf",
                },
              ],
            }
          }
        } catch {}
      }
    }
  }

  return result
}

let bufferStr = ""
process.stdin.on("data", async (chunk) => {
  bufferStr += chunk.toString("utf8")
  const lines = bufferStr.split("\n")
  bufferStr = lines.pop() || ""

  for (const line of lines) {
    if (!line.trim()) continue
    try {
      const req: JsonRpcRequest = JSON.parse(line)
      const { id, method, params } = req

      if (method === "initialize") {
        const response: JsonRpcResponse = {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: "careeragent-mcp",
              version: "2.13.5",
            },
          },
        }
        process.stdout.write(JSON.stringify(response) + "\n")
      } else if (method === "notifications/initialized") {
        // Notification
      } else if (method === "tools/list") {
        const response: JsonRpcResponse = {
          jsonrpc: "2.0",
          id,
          result: {
            tools: TOOLS,
          },
        }
        process.stdout.write(JSON.stringify(response) + "\n")
      } else if (method === "tools/call") {
        const { name, arguments: toolArgs } = params || {}
        try {
          const result = await handleCallTool(name, toolArgs)
          const response: JsonRpcResponse = {
            jsonrpc: "2.0",
            id,
            result,
          }
          process.stdout.write(JSON.stringify(response) + "\n")
        } catch (toolErr: any) {
          const response: JsonRpcResponse = {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32603,
              message: toolErr.message || "Tool call error",
            },
          }
          process.stdout.write(JSON.stringify(response) + "\n")
        }
      } else if (id !== undefined) {
        const response: JsonRpcResponse = {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
        }
        process.stdout.write(JSON.stringify(response) + "\n")
      }
    } catch (err: any) {
      console.error("Error parsing JSON-RPC line:", err)
    }
  }
})
