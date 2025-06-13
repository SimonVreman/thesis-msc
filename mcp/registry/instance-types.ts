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
  { name: "D2ls v5", vcpu: 2, memory: 4, price: 0.097 },
  { name: "D2 v5", vcpu: 2, memory: 8, price: 0.115 },
  { name: "E2as v6", vcpu: 2, memory: 16, price: 0.144 },
  { name: "D4ls v5", vcpu: 4, memory: 8, price: 0.194 },
  { name: "D4 v5", vcpu: 4, memory: 16, price: 0.23 },
  { name: "D8 v5", vcpu: 8, memory: 32, price: 0.46 },
  { name: "E8as v5", vcpu: 8, memory: 64, price: 0.548 },
  { name: "D16 v5", vcpu: 16, memory: 64, price: 0.92 },
  { name: "D32 v5", vcpu: 32, memory: 128, price: 1.84 },
  { name: "D48 v5", vcpu: 48, memory: 192, price: 2.76 },
] as const;

export const gcpInstanceTypes = [
  { name: "e2-micro", vcpu: 2, memory: 2, price: 0.0184 },
  { name: "n4-highcpu-2", vcpu: 2, memory: 4, price: 0.088 },
  { name: "n2-standard-2", vcpu: 2, memory: 8, price: 0.1044 },
  { name: "n4-highmem-2", vcpu: 2, memory: 16, price: 0.137 },
  { name: "n4-highcpu-4", vcpu: 4, memory: 8, price: 0.1761 },
  { name: "n2-standard-4", vcpu: 4, memory: 16, price: 0.2087 },
  { name: "n2-standard-8", vcpu: 8, memory: 32, price: 0.4174 },
  { name: "n4-highmem-8", vcpu: 8, memory: 64, price: 0.5479 },
  { name: "n2-standard-16", vcpu: 16, memory: 64, price: 0.8348 },
  { name: "n2-standard-32", vcpu: 32, memory: 128, price: 1.6697 },
  { name: "n2-standard-48", vcpu: 48, memory: 192, price: 2.5045 },
] as const;

export const instanceTypes = [
  ...awsInstanceTypes,
  ...azureInstanceTypes,
  ...gcpInstanceTypes,
] as const;
