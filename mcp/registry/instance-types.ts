export const awsInstanceTypes = [
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

export const azureInstanceTypes = [
  { name: "B2ts v2", vcpu: 2, memory: 1, price: 0.012 },
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

export const gcpInstanceTypes = [
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

export const instanceTypes = [
  ...awsInstanceTypes,
  ...azureInstanceTypes,
  ...gcpInstanceTypes,
] as const;

const typeForSpecs = ({
  types,
  vcpu,
  memory,
}: {
  types: readonly {
    name: string;
    vcpu: number | { min: number; max: number; step: number };
    memory: number | { min: number; max: number; step: number };
  }[];
  vcpu: number;
  memory: number;
}) =>
  types
    .toReversed()
    .find(
      (t) =>
        typeof t.vcpu !== "object" &&
        typeof t.memory !== "object" &&
        t.vcpu <= vcpu &&
        t.memory <= memory
    );

export const vmInstanceTypeMap = ({
  vcpu,
  memory,
  provider,
}: {
  vcpu: number;
  memory: number;
  provider: "aws" | "azure" | "gcp";
}) => {
  const types = {
    aws: awsInstanceTypes,
    azure: azureInstanceTypes,
    gcp: gcpInstanceTypes,
  }[provider];

  const nearest =
    (vcpu === 2 && memory === 32) || (vcpu === 4 && memory === 32)
      ? { vcpu, memory: 16 }
      : vcpu === 24 && memory === 64
      ? { vcpu: 16, memory: 64 }
      : vcpu === 30 && memory === 70
      ? { vcpu: 32, memory: 128 }
      : { vcpu, memory };

  return typeForSpecs({ types, ...nearest });
};

// cpu, mem, availability
// 2	2       Azure           *2/1
// 2	2       AWS, GCP        *2/2
// 2	4       AWS, Azure, GCP *2/4
// 2	8       AWS, Azure, GCP *2/8
// 2	32      AWS, Azure, GCP *2/16
// 4	8       AWS, Azure, GCP *4/8
// 4	32      AWS, Azure, GCP *4/16
// 8	32      AWS, Azure, GCP *8/32
// 8	64      AWS, Azure, GCP *8/64
// 24	64      AWS, Azure, GCP *16/64
// 30	70      AWS, Azure, GCP *32/128

const providers = ["aws", "azure", "gcp"] as const;
// Relies on our sampling for even distrubution of VMs across providers.
export const providerById = (id: string) =>
  providers["ABCDEF".indexOf(id[0]) % providers.length];
