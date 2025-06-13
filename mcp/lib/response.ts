export function textSuccess(text: string): {
  content: { type: "text"; text: string }[];
} {
  return { content: [{ type: "text", text }] };
}

export function textError(text: string): {
  isError: true;
  content: { type: "text"; text: string }[];
} {
  return { isError: true, content: [{ type: "text", text }] };
}
