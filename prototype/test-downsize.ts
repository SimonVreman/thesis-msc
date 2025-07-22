import { MCPServerStreamableHttp, run } from "@openai/agents";
import { createDownsizeAgent } from "./lib/prototype/agents/downsize";
import { mergeById } from "./lib/utils";

const testScenario = {
  instances: [
    {
      id: "Cyz8rg3fcpnC0E5klcBHQaT5LFdn4rmxhnlNZtEDYDlFndFrFznNC4H4QeFfQba0",
      type: "n4-highcpu-4", // n4-standard-2
      provider: "gcp",
    },
    {
      id: "F/aQa4NZRdCQurvTgNuChamriYmio9rjWkQlQZzgeO15T8izbZhP4+z7B4f0GzGh",
      type: "n4-standard-4", // n4-highmem-2
      provider: "gcp",
    },
    {
      id: "BXCwy0LmVHYD92rxqhc7upDkd6NkIA8sSYXazbEUYSyN+uaQZCQwSgihPXveXcpC",
      type: "D4 v5", // E2as v6
      provider: "azure",
    },
    {
      id: "C5Vii10f3dz7TrZZSYzKpp+ON8IYho2IqBvAoOGGXSYI0pmEugbkk6YeTzLPg0hQ",
      type: "n4-highcpu-4", // n4-standard-2
      provider: "gcp",
    },
    {
      id: "Ejzx5U67j6RaAVY6fqVKfxaFMePnkNyykx0KUD7lXmLSxKDlC3Fg9gygIGFRMJpn",
      type: "D4 v5", // E2as v6
      provider: "azure",
    },
    {
      id: "EbRgBvJiF2uMipD6gUXDm2RM1Ap5T/NWhwrgGMYw5BSgMpcUnU3IA8+ZOBOHkjC0",
      type: "D4ls v5", // D2 v5
      provider: "azure",
    },
    {
      id: "FVvqrTHn++m1S0CO7ACKG4yokqT4iM+zGBYh3XCb80EqYLDDPicLqKgPsasFHPy0",
      type: "n4-standard-8", // n4-standard-4
      provider: "gcp",
    },
    {
      id: "DZirLMh8A5fKT4tZL/8AasvwFQfFo3LgA92LLmpgflex/PxXp2ArAyn7SNCeP3JL",
      type: "m5.xlarge", // r5.large
      provider: "aws",
    },
    {
      id: "C0ifucMODsjNZy6YOWlD7y7QIWCFSb2y+HVOjq+e1htyv+Wb21W8ocN6pGity0Kz",
      type: "n4-highcpu-4", // n4-standard-2
      provider: "gcp",
    },
    {
      id: "FmnnLTcEGFU3ckikyDQtlbYdiDEwyD0R88k3jopSSq/uXEPuRbKh2b1w2mIz0trW",
      type: "n4-standard-16", // n4-highmem-8
      provider: "gcp",
    },
  ],
};

const testScenarioCheck = {
  instances: [
    {
      id: "Cyz8rg3fcpnC0E5klcBHQaT5LFdn4rmxhnlNZtEDYDlFndFrFznNC4H4QeFfQba0",
      correctNewType: "n4-standard-2",
    },
    {
      id: "F/aQa4NZRdCQurvTgNuChamriYmio9rjWkQlQZzgeO15T8izbZhP4+z7B4f0GzGh",
      correctNewType: "n4-highmem-2",
    },
    {
      id: "BXCwy0LmVHYD92rxqhc7upDkd6NkIA8sSYXazbEUYSyN+uaQZCQwSgihPXveXcpC",
      correctNewType: "E2as v6",
    },
    {
      id: "C5Vii10f3dz7TrZZSYzKpp+ON8IYho2IqBvAoOGGXSYI0pmEugbkk6YeTzLPg0hQ",
      correctNewType: "n4-standard-2",
    },
    {
      id: "Ejzx5U67j6RaAVY6fqVKfxaFMePnkNyykx0KUD7lXmLSxKDlC3Fg9gygIGFRMJpn",
      correctNewType: "E2as v6",
    },
    {
      id: "EbRgBvJiF2uMipD6gUXDm2RM1Ap5T/NWhwrgGMYw5BSgMpcUnU3IA8+ZOBOHkjC0",
      correctNewType: "D2 v5",
    },
    {
      id: "FVvqrTHn++m1S0CO7ACKG4yokqT4iM+zGBYh3XCb80EqYLDDPicLqKgPsasFHPy0",
      correctNewType: "n4-standard-4",
    },
    {
      id: "DZirLMh8A5fKT4tZL/8AasvwFQfFo3LgA92LLmpgflex/PxXp2ArAyn7SNCeP3JL",
      correctNewType: "r5.large",
    },
    {
      id: "C0ifucMODsjNZy6YOWlD7y7QIWCFSb2y+HVOjq+e1htyv+Wb21W8ocN6pGity0Kz",
      correctNewType: "n4-standard-2",
    },
    {
      id: "FmnnLTcEGFU3ckikyDQtlbYdiDEwyD0R88k3jopSSq/uXEPuRbKh2b1w2mIz0trW",
      correctNewType: "n4-highmem-8",
    },
  ],
};

const awsInstanceTypes = [
  { name: "t3a.small", vcpu: 2, memory: 2, price: 0.0204 },
  { name: "c5.large", vcpu: 2, memory: 4, price: 0.096 },
  { name: "m5.large", vcpu: 2, memory: 8, price: 0.107 },
  { name: "r5.large", vcpu: 2, memory: 16, price: 0.141 },
  { name: "c5.xlarge", vcpu: 4, memory: 8, price: 0.192 },
  { name: "m5.xlarge", vcpu: 4, memory: 16, price: 0.214 },
  { name: "m5.2xlarge", vcpu: 8, memory: 32, price: 0.428 },
  { name: "r5.2xlarge", vcpu: 8, memory: 64, price: 0.564 },
  { name: "m5.4xlarge", vcpu: 16, memory: 64, price: 0.856 },
  { name: "m5.8xlarge", vcpu: 32, memory: 128, price: 1.712 },
  { name: "m5.12xlarge", vcpu: 48, memory: 192, price: 2.568 },
] as const;

const azureInstanceTypes = [
  { name: "D2ls v5", vcpu: 2, memory: 4, price: 0.097 },
  { name: "D2 v5", vcpu: 2, memory: 8, price: 0.115 },
  { name: "E2as v6", vcpu: 2, memory: 16, price: 0.144 },
  { name: "D4ls v5", vcpu: 4, memory: 8, price: 0.194 },
  { name: "D4 v5", vcpu: 4, memory: 16, price: 0.23 },
  { name: "D8 v5", vcpu: 8, memory: 32, price: 0.46 },
  { name: "E8as v6", vcpu: 8, memory: 64, price: 0.577 },
  { name: "D16 v5", vcpu: 16, memory: 64, price: 0.92 },
  { name: "D32 v5", vcpu: 32, memory: 128, price: 1.84 },
  { name: "D48 v5", vcpu: 48, memory: 192, price: 2.76 },
] as const;

const gcpInstanceTypes = [
  { name: "e2-micro", vcpu: 2, memory: 2, price: 0.0184 },
  { name: "n4-highcpu-2", vcpu: 2, memory: 4, price: 0.088 },
  { name: "n4-standard-2", vcpu: 2, memory: 8, price: 0.1044 },
  { name: "n4-highmem-2", vcpu: 2, memory: 16, price: 0.137 },
  { name: "n4-highcpu-4", vcpu: 4, memory: 8, price: 0.1761 },
  { name: "n4-standard-4", vcpu: 4, memory: 16, price: 0.2087 },
  { name: "n4-standard-8", vcpu: 8, memory: 32, price: 0.4174 },
  { name: "n4-highmem-8", vcpu: 8, memory: 64, price: 0.5479 },
  { name: "n4-standard-16", vcpu: 16, memory: 64, price: 0.8348 },
  { name: "n4-standard-32", vcpu: 32, memory: 128, price: 1.6697 },
  { name: "n4-standard-48", vcpu: 48, memory: 192, price: 2.5045 },
  {
    name: "n4-custom",
    vcpu: { min: 2, max: 80, step: 2 },
    memory: { min: 2, max: 8, step: 0.25 },
    price: { core: 0.0377, memory: 0.0043 },
  },
] as const;

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

await withMcp(async () => {
  const agent = createDownsizeAgent();

  const results = await Promise.all(
    testScenario.instances.map(async ({ id, type, provider }) => {
      const options =
        provider === "aws"
          ? awsInstanceTypes
          : provider === "azure"
          ? azureInstanceTypes
          : gcpInstanceTypes;

      const output = await run(
        agent,
        JSON.stringify({ instance: { id, type }, options })
      );

      return { id, newType: output.finalOutput?.newType || null };
    })
  );

  console.log(mergeById(results, testScenarioCheck.instances));
});
