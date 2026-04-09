import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TerminalSurface } from "./TerminalSurface";
import type { TerminalTransport, TerminalTransportEvents } from "../types";

afterEach(() => {
  cleanup();
});

class MockTransport implements TerminalTransport {
  public sent: string[] = [];
  public events: TerminalTransportEvents | null = null;

  connect(events: TerminalTransportEvents) {
    this.events = events;
    events.onStatus?.("connected");
  }

  send(input: string) {
    this.sent.push(input);
  }
}

describe("TerminalSurface", () => {
  it("renders a terminal log and accepts keyboard input", () => {
    const transport = new MockTransport();

    render(<TerminalSurface title="Demo shell" transport={transport} autoConnect={false} />);

    const terminal = screen.getByRole("group", { name: "Terminal session" });
    fireEvent.keyDown(terminal, { key: "h" });
    fireEvent.keyDown(terminal, { key: "i" });
    fireEvent.keyDown(terminal, { key: "Enter" });

    expect(transport.sent).toEqual(["h", "i", "\r"]);
    expect(screen.getByRole("log")).not.toBeNull();
  });

  it("calls onSubmit in local mode", () => {
    const onSubmit = vi.fn();

    render(<TerminalSurface autoConnect={false} onSubmit={onSubmit} />);

    const terminal = screen.getByRole("group", { name: "Terminal session" });
    fireEvent.keyDown(terminal, { key: "l" });
    fireEvent.keyDown(terminal, { key: "s" });
    fireEvent.keyDown(terminal, { key: "Enter" });

    expect(onSubmit).toHaveBeenCalledWith({
      input: "ls",
      prompt: "$"
    });
  });
});
