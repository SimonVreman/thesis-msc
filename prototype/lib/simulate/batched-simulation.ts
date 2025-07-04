import type { Agents } from "../prototype/agents/constants";
import { runPrototype } from "../prototype/prototype";

export type SimulationBatchResult = ({
  id: number;
  scenario: string;
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
  content: (id: number) => Promise<string>;
}) {
  for (let chunk = 0; chunk < Math.ceil(maxIndex / chunkSize); chunk++) {
    const result = await runBatch({
      agents,
      scenarios: [...Array(chunkSize)].map((_, i) => ({
        id: chunk * chunkSize + i,
        content: content(chunk * chunkSize + i),
      })),
    });

    await process({ batch: result, index: chunk });
  }
}

async function runBatch({
  scenarios,
  agents,
}: {
  scenarios: { id: number; content: Promise<string> }[];
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
