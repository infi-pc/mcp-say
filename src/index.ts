#!/usr/bin/env node

// Ref: https://modelcontextprotocol.io/quickstart

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import say from "say";

// Define Zod schemas for validation
const SayArgumentsSchema = z.object({
  text: z.string(),
});

// Create server instance
const server = new Server(
  {
    name: "mcp-say",
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "say",
        description: "Say something",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
            },
          },
          required: ["text"],
        },
      },
      //   {
      //     name: "get-alerts",
      //     description: "Get weather alerts for a US state",
      //     inputSchema: {
      //       type: "object",
      //       properties: {
      //         state: {
      //           type: "string",
      //           description: "Two-letter US state code (e.g. CA, NY)",
      //         },
      //       },
      //       required: ["state"],
      //     },
      //   },
      //   {
      //     name: "get-forecast",
      //     description: "Get weather forecast for a location in the US",
      //     inputSchema: {
      //       type: "object",
      //       properties: {
      //         latitude: {
      //           type: "number",
      //           description: "Latitude of the location",
      //         },
      //         longitude: {
      //           type: "number",
      //           description: "Longitude of the location",
      //         },
      //       },
      //       required: ["latitude", "longitude"],
      //     },
      //   },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "say") {
      const { text } = SayArgumentsSchema.parse(args);

      say.speak(text);
      return {
        content: [
          {
            type: "text",
            text: text,
          },
        ],
      };
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid arguments: ${error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }
    throw error;
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Say Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
