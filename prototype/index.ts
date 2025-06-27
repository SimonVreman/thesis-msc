import { MCPServerStreamableHttp } from "@openai/agents";
import { createPriceAgent } from "./agents/price";
import { createUsageAgent } from "./agents/usage";
import { simulate } from "./lib/simulate";
import { createProviderAgent } from "./agents/provider";

const localMcpServers = [
  [5050, "Azure"],
  [5051, "AWS"],
  [5052, "GCP"],
] as const;

async function main() {
  const mcp = localMcpServers.map(
    ([port, name]) =>
      new MCPServerStreamableHttp({
        url: `http://localhost:${port}/mcp`,
        name: `${name} MCP Server`,
        cacheToolsList: true,
      })
  );

  await Promise.all(mcp.map((s) => s.connect()));

  try {
    const agents = {
      provider: createProviderAgent({ mcp }),
      price: createPriceAgent({ mcp }),
      usage: createUsageAgent({ mcp }),
    };

    const scenario = await Bun.file(
      "../mcp/generated/scenarios/scenario-9.json"
    ).text();

    await simulate({ scenario, agents });
  } finally {
    await Promise.all(mcp.map((s) => s.close()));
  }
}

await main();
