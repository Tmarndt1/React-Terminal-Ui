import { describe, expect, it } from "vitest";
import { appendChunk, createStaticTranscript, stripAnsi } from "./terminalBuffer";

describe("terminalBuffer", () => {
  it("strips ansi escape codes", () => {
    expect(stripAnsi("\u001b[31merror\u001b[0m")).toBe("error");
  });

  it("appends chunks without mutating prior line objects", () => {
    const initial = createStaticTranscript(["hello"]);
    const originalFirstLine = initial[0];

    const next = appendChunk(initial, " world");

    expect(next[0].text).toBe("hello world");
    expect(initial[0].text).toBe("hello");
    expect(next[0]).not.toBe(originalFirstLine);
  });

  it("applies backspace control characters", () => {
    const next = appendChunk([], "abc\b\bz");

    expect(next[0].text).toBe("az");
  });
});
