# Agentic AI Optimizer for FinOps in multi-cloud environments

This repository contains the code for the Master's thesis _"Agentic AI for FinOps in multi-cloud environments"_. It is separated in three folders: `prototype` contains the prototype employed in the research, `mcp` the mock MCP servers, data import utilities and scenario generation, and `figures` contains the code used to generate the figures used in the thesis.

The prototype, MCP mock servers and tools are all written in Typescript and use the Bun runtime.

## Prototype

Install dependencies using `bun install` and run using `bun start`. Requires the local MCP servers to be running, and the scenarios to be generated.

## MCP

Install dependencies using `bun install` and run using `bun start`. Relies on import (a sample of) the Azure Public Dataset in a local Postgres database using the command line tools included. There is also a tool to generate the scenarios in this project. The commands for this can be found in `mcp/package.json`.
