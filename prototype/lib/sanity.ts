import { fetch } from "bun";
import type { Scenario } from "./types";

export async function getSanity(scenario: Scenario): Promise<{
  instances: {
    id: string;
    p95: number;
    avg: number;
    price?: number;
    name: string;
    provider: string;
    lifetime: number;
  }[];
}> {
  return await fetch("http://localhost:5100/sanity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scenario),
  }).then((res) => res.json());
}
