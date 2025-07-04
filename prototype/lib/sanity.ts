import { fetch } from "bun";

export async function getSanity(scenario: string): Promise<{
  instances: {
    id: string;
    p95: number;
    price: number;
    name: string;
  }[];
}> {
  return await fetch("http://localhost:5100/sanity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: scenario,
  }).then((res) => res.json());
}
