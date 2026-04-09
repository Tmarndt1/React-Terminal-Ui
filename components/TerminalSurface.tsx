import {
  KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef
} from "react";
import { useTerminalSession, UseTerminalSessionOptions } from "../hooks/useTerminalSession";
import { TerminalTheme, TerminalTransport } from "../types";
import { TerminalWindow } from "./TerminalWindow";

export interface TerminalSurfaceProps extends UseTerminalSessionOptions {
  theme?: TerminalTheme;
  title?: string;
  className?: string;
  transport?: TerminalTransport;
  prompt?: string;
}

export function TerminalSurface({
  theme = "linux",
  title,
  className,
  prompt = "$",
  transport,
  welcomeMessage,
  autoConnect,
  maxLines
}: TerminalSurfaceProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const session = useTerminalSession({
    transport,
    welcomeMessage,
    prompt,
    autoConnect,
    maxLines
  });

  useLayoutEffect(() => {
    if (!viewportRef.current) {
      return;
    }

    viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
  }, [session.lines, session.input]);

  useEffect(() => {
    const root = rootRef.current;
    const measure = measureRef.current;
    if (!root || !measure) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      const width = root.clientWidth - 32;
      const height = root.clientHeight - 48;
      const charWidth = measure.getBoundingClientRect().width || 9;
      const lineHeight = parseFloat(getComputedStyle(measure).lineHeight) || 22;

      const cols = Math.max(20, Math.floor(width / charWidth));
      const rows = Math.max(8, Math.floor(height / lineHeight));

      void session.resize({ cols, rows });
    });

    resizeObserver.observe(root);
    return () => resizeObserver.disconnect();
  }, [session.resize]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.altKey) {
      return;
    }

    if (transport && event.ctrlKey && event.key.length === 1) {
      event.preventDefault();
      const controlCode = String.fromCharCode(event.key.toUpperCase().charCodeAt(0) - 64);
      session.sendInput(controlCode);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      session.submitInput();
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      if (transport) {
        session.sendInput("\u007f");
      } else {
        session.setInput(session.input.slice(0, -1));
      }
      return;
    }

    if (transport && event.key.startsWith("Arrow")) {
      event.preventDefault();
      const arrowMap: Record<string, string> = {
        ArrowUp: "\u001b[A",
        ArrowDown: "\u001b[B",
        ArrowRight: "\u001b[C",
        ArrowLeft: "\u001b[D"
      };
      session.sendInput(arrowMap[event.key]);
      return;
    }

    if (transport && event.key === "Escape") {
      event.preventDefault();
      session.sendInput("\u001b");
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      session.sendInput("\t");
      return;
    }

    if (event.key.length === 1) {
      event.preventDefault();
      if (transport) {
        session.sendInput(event.key);
      } else {
        session.setInput(session.input + event.key);
      }
    }
  };

  return (
    <TerminalWindow
      title={title ?? session.title}
      theme={theme}
      status={session.status}
    >
      <div
        ref={rootRef}
        className={`wtk-terminal ${className ?? ""}`.trim()}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseDown={(event) => {
          event.currentTarget.focus();
        }}
      >
        <div ref={viewportRef} className="wtk-viewport">
          {session.lines.map((line) => (
            <div key={line.id} className={`wtk-line wtk-line--${line.kind ?? "output"}`}>
              {line.text || "\u00A0"}
            </div>
          ))}
          <div className="wtk-line wtk-line--active">
            <span className="wtk-prompt">{prompt}</span>
            <span className="wtk-input">{session.input}</span>
            <span className="wtk-cursor" aria-hidden="true" />
          </div>
        </div>
        <span ref={measureRef} className="wtk-measure">
          M
        </span>
      </div>
    </TerminalWindow>
  );
}
