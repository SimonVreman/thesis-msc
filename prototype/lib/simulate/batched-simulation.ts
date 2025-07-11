import type { Agents } from "../prototype/agents/constants";
import { runPrototype } from "../prototype/prototype";
import type { Scenario } from "../types";

export type SimulationBatchResult = ({
  id: number;
  scenario: Scenario;
} & (
  | {
      success: true;
      result: Awaited<ReturnType<typeof runPrototype>>;
    }
  | {
      success: false;
      result: undefined;
    }
))[];

export async function batchedSimulation({
  agents,
  chunkSize,
  maxIndex,
  process,
  content,
}: {
  agents: Agents;
  chunkSize: number;
  maxIndex: number;
  process: (v: {
    batch: SimulationBatchResult;
    index: number;
  }) => Promise<void>;
  content: (id: number) => Promise<Scenario>;
}) {
  for (let index = 0; index < maxIndex; index += chunkSize) {
    const result = await runBatch({
      agents,
      scenarios: [...Array(Math.min(maxIndex - index, chunkSize))].map(
        (_, i) => ({
          id: index + i,
          content: content(index + i),
        })
      ),
    });

    await process({ batch: result, index: index / chunkSize });
  }
}

async function runBatch({
  scenarios,
  agents,
}: {
  scenarios: { id: number; content: Promise<Scenario> }[];
  agents: Agents;
}): Promise<SimulationBatchResult> {
  return await Promise.all(
    scenarios.map(async ({ id, content }) =>
      runPrototype({ scenario: await content, agents })
        .then(async (result) => ({
          id,
          scenario: await content,
          success: true as true,
          result,
        }))
        .catch(async (e) => {
          console.error(`Simulation ${id} failed:`, e);
          return {
            id,
            scenario: await content,
            success: false as false,
            result: undefined,
          };
        })
    )
  );
}
