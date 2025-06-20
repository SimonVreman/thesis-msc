import { MCPServerStreamableHttp, run } from "@openai/agents";
import { createPriceAgent, type PriceAgent } from "./agents/price";
import { createUsageAgent, type UsageAgent } from "./agents/usage";

const localMcpServers = [
  [5050, "Azure"],
  [5051, "AWS"],
  [5052, "GCP"],
] as const;

async function simulate({
  scenario,
  mcp,
  agents,
}: {
  scenario: string;
  mcp: MCPServerStreamableHttp[];
  agents: { price: PriceAgent; usage: UsageAgent };
}) {
  const [prices, usage] = await Promise.all([
    run(agents.price, scenario),
    run(agents.usage, scenario),
  ]);

  console.log("Price results:", prices);
  console.log("Usage results:", usage);
}

async function main() {
  const mcp = localMcpServers.map(
    ([port, name]) =>
      new MCPServerStreamableHttp({
        url: `http://localhost:${port}/mcp`,
        name: `${name} MCP Server`,
      })
  );

  await Promise.all(mcp.map((s) => s.connect()));

  try {
    const agents = {
      price: createPriceAgent({ mcp }),
      usage: createUsageAgent({ mcp }),
    };

    const scenario = "";

    await simulate({ scenario, mcp, agents });
  } finally {
    await Promise.all(mcp.map((s) => s.close()));
  }
}
