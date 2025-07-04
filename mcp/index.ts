import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type Request, type Response } from "express";
import { createAzure } from "./servers/azure";
import { createAws } from "./servers/aws";
import { createGCP } from "./servers/gcp";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { attachSanityHandler } from "./lib/sanity";

const getTransport = () =>
  new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

function startApp({
  create: getServer,
  port,
  name,
}: {
  create: () => McpServer;
  port: number;
  name: string;
}) {
  const app = express();
  app.use(express.json());

  async function requestHandler(req: Request, res: Response) {
    try {
      const server = getServer();
      const transport = getTransport();

      res.on("close", () => {
        transport.close();
        server.close();
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  }

  app.post("/mcp", requestHandler);
  app.get("/mcp", requestHandler);
  app.delete("/mcp", requestHandler);

  app.listen(port, () =>
    console.log(`MCP server "${name}" listening on port ${port}`)
  );
}

startApp({ create: createAzure, port: 5050, name: "Azure" });
startApp({ create: createAws, port: 5051, name: "AWS" });
startApp({ create: createGCP, port: 5052, name: "GCP" });

const sanity = express();
sanity.use(express.json());
attachSanityHandler(sanity);
sanity.listen(5100, () => console.log("Sanity listening on port 5100"));
