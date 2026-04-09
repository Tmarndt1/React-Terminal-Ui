import { useMemo, useState } from "react";
import { TerminalSurface } from "../index";
import type {
  TerminalConnectionStatus,
  TerminalTransport,
  TerminalTransportEvents
} from "../types";

type ThemeMode = "linux" | "windows";

interface PreviewCommandContext {
  setTheme: (theme: ThemeMode) => void;
  resetSession: () => void;
}

type PreviewCommandResult = string | string[] | void;

const commandHandlers: Record<string, (context: PreviewCommandContext) => PreviewCommandResult> = {
  help: () => [
    "Available commands:",
    "- help: List the available commands.",
    "- about: Summarize what the library is optimized for.",
    "- status: Show the release-readiness of this package.",
    "- theme linux: Switch the shell chrome to the Linux theme.",
    "- theme windows: Switch the shell chrome to the Windows theme.",
    "- clear: Reset the transcript and start a fresh session."
  ],
  about: () => [
    "React Terminal UI is a presentational terminal toolkit for React apps.",
    "It gives you a polished shell frame, session management hooks, and transport integration points."
  ],
  status: () => [
    "Publish pipeline:",
    "- Typecheck: passing",
    "- Tests: passing",
    "- Library build: passing"
  ],
  "theme linux": ({ setTheme }) => {
    setTheme("linux");
    return "Theme switched to linux.";
  },
  "theme windows": ({ setTheme }) => {
    setTheme("windows");
    return "Theme switched to windows.";
  },
  clear: ({ resetSession }) => {
    resetSession();
    return;
  }
};

export function App() {
  const [theme, setTheme] = useState<ThemeMode>("linux");
  const [sessionKey, setSessionKey] = useState(0);

  const resetSession = () => {
    setSessionKey((current) => current + 1);
  };

  const transport = useMemo(
    () =>
      new PreviewTerminalTransport((command) => {
        const normalized = command.trim().toLowerCase();
        const handler = commandHandlers[normalized];

        if (!handler) {
          return [
            `Command not found: ${command || "(empty)"}`,
            "Type `help` to see the available preview commands."
          ];
        }

        return handler({
          setTheme,
          resetSession
        });
      }),
    [setTheme]
  );

  return (
    <main className={`demo-shell demo-shell--${theme}`}>
      <div className="demo-shell__backdrop" aria-hidden="true" />
      <section className="demo-grid">
        <div className="demo-hero">
          <div className="demo-hero__copy">
            <p className="demo-hero__eyebrow">Interactive Preview</p>
            <h1 className="demo-hero__title">A terminal component that feels intentional, not improvised.</h1>
            <p className="demo-hero__body">
              The preview is back as a proper showroom: interactive commands, live theme switching, and a
              landing page that actually sells the library.
            </p>
            <div className="demo-hero__actions">
              <button
                type="button"
                className={`demo-pill ${theme === "linux" ? "demo-pill--active" : ""}`}
                onClick={() => setTheme("linux")}
              >
                Linux frame
              </button>
              <button
                type="button"
                className={`demo-pill ${theme === "windows" ? "demo-pill--active" : ""}`}
                onClick={() => setTheme("windows")}
              >
                Windows frame
              </button>
              <button type="button" className="demo-pill" onClick={resetSession}>
                Reset session
              </button>
            </div>
          </div>
          <div className="demo-stats" aria-label="Preview highlights">
            <div className="demo-stat">
              <span className="demo-stat__label">Build outputs</span>
              <strong>ESM, CJS, DTS</strong>
            </div>
            <div className="demo-stat">
              <span className="demo-stat__label">Interaction model</span>
              <strong>Keyboard-first</strong>
            </div>
            <div className="demo-stat">
              <span className="demo-stat__label">Transport style</span>
              <strong>Pluggable</strong>
            </div>
          </div>
        </div>

        <div className="demo-terminal-card">
          <div className="demo-terminal-card__header">
            <div>
              <p className="demo-section-label">Live terminal</p>
              <h2>Type commands directly into the shell</h2>
            </div>
            <p className="demo-terminal-card__hint">Try `help`, `about`, `status`, `theme windows`, or `clear`.</p>
          </div>
          <div className="demo-terminal-frame">
            <TerminalSurface
              key={`${theme}-${sessionKey}`}
              title={theme === "linux" ? "preview@react-terminal-ui" : "Preview Console"}
              theme={theme}
              transport={transport}
              autoConnect
              autoFocus
              prompt={theme === "linux" ? "$" : ">"}
              screenReaderLabel="React Terminal UI interactive preview"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

class PreviewTerminalTransport implements TerminalTransport {
  private events: TerminalTransportEvents | null = null;
  private buffer = "";
  private readonly onCommand: (command: string) => PreviewCommandResult;

  constructor(onCommand: (command: string) => PreviewCommandResult) {
    this.onCommand = onCommand;
  }

  connect(events: TerminalTransportEvents): void {
    this.events = events;
    events.onStatus?.("connecting");

    window.setTimeout(() => {
      events.onStatus?.("connected");
      events.onTitle?.("preview-shell");
      this.pushLines([
        "React Terminal UI demo shell",
        "Type `help` to explore the component.",
        ""
      ]);
    }, 120);
  }

  disconnect(): void {
    this.buffer = "";
    this.events?.onStatus?.("disconnected");
    this.events = null;
  }

  send(input: string): void {
    if (!this.events) {
      return;
    }

    if (input === "\r") {
      const command = this.buffer;
      this.pushLines([`$ ${command}`]);
      this.buffer = "";

      const output = this.onCommand(command);
      if (typeof output === "string") {
        this.pushLines([output, ""]);
      } else if (Array.isArray(output)) {
        this.pushLines([...output, ""]);
      }
      return;
    }

    if (input === "\u007f") {
      this.buffer = this.buffer.slice(0, -1);
      return;
    }

    if (input.startsWith("\u001b[")) {
      return;
    }

    this.buffer += input;
  }

  private pushLines(lines: string[]) {
    this.events?.onData?.(`${lines.join("\n")}\n`);
  }
}
