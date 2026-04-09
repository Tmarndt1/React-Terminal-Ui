import { TerminalLine } from "../types";

const ANSI_PATTERN = /\u001b\[[0-9;?]*[ -/]*[@-~]/g;
let terminalLineId = 0;

export function stripAnsi(input: string): string {
  return input.replace(ANSI_PATTERN, "");
}

export function createLine(text = "", kind: TerminalLine["kind"] = "output"): TerminalLine {
  return {
    id: `wtk-line-${terminalLineId++}`,
    text,
    kind
  };
}

export function appendChunk(lines: TerminalLine[], chunk: string): TerminalLine[] {
  const sanitized = stripAnsi(chunk).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const next = lines.map((line) => ({ ...line }));
  const parts = sanitized.split("\n");

  if (next.length === 0) {
    next.push(createLine());
  }

  parts.forEach((part, index) => {
    const current = next[next.length - 1];
    current.text = applyControlCharacters(`${current.text}${part}`);

    if (index < parts.length - 1) {
      next.push(createLine());
    }
  });

  return next;
}

export function createStaticTranscript(text: string | string[]): TerminalLine[] {
  const chunks = Array.isArray(text) ? text : text.split(/\r?\n/);
  return chunks.map((line) => createLine(line, "system"));
}

function applyControlCharacters(input: string): string {
  let output = "";

  for (const char of input) {
    if (char === "\b") {
      output = output.slice(0, -1);
      continue;
    }

    output += char;
  }

  return output;
}
