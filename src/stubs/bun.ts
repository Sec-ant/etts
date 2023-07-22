import { encode } from "html-entities";

export function escapeHTML(input: string): string {
  return encode(input, {
    level: "xml",
  });
}
