import { MCPServerStreamableHttp } from "@openai/agents";
import { createPriceAgent } from "../prototype/agents/price";
import { createUsageAgent } from "../prototype/agents/usage";
import { createWasteAgent } from "../prototype/agents/waste";
import { batchedSimulation } from "./batched-simulation";
import {
  createMetaWriter,
  createResultWriter,
  processBatch,
} from "./process-simulation";
import { createDownsizeAgent } from "../prototype/agents/downsize";
import { createOfferingAgent } from "../prototype/agents/offering";

const localMcpServers = [
  [5050, "Azure"],
  [5051, "AWS"],
  [5052, "GCP"],
] as const;

async function withMcp(
  fn: (mcp: MCPServerStreamableHttp[]) => Promise<unknown>
) {
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
    await fn(mcp);
  } finally {
    await Promise.all(mcp.map((s) => s.close()));
  }
}

export const simulate = async () =>
  await withMcp(async (mcp) => {
    const agents = {
      price: createPriceAgent({ mcp }),
      usage: createUsageAgent({ mcp }),
      waste: createWasteAgent(),
      downsize: createDownsizeAgent(),
      offering: await createOfferingAgent({ mcp }),
    };

    console.log("Starting simulation...");
    let lastStart = performance.now();

    const out = createResultWriter();
    const outMeta = createMetaWriter();

    await batchedSimulation({
      agents,
      chunkSize: 50,
      maxIndex: 5000,
      content: async (id) =>
        await Bun.file(`../mcp/generated/scenarios/scenario-${id}.json`).json(),
      process: async ({ batch, index }) => {
        console.log(
          `Batch ${index} completed in ${(
            (performance.now() - lastStart) /
            1000
          ).toFixed(3)}s, ${
            batch.filter((s) => !s.success).length
          } failures, processing results...`
        );

        lastStart = performance.now();
        await processBatch({ batch, out, outMeta });

        console.log(
          `Processed results for batch ${index} in ${(
            (performance.now() - lastStart) /
            1000
          ).toFixed(3)}s`
        );

        lastStart = performance.now();
      },
    });

    out.end();
    console.log("Simulation completed successfully.");
  });
