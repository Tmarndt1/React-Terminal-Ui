import { PropsWithChildren } from "react";
import { TerminalConnectionStatus, TerminalTheme } from "../types";

export interface TerminalWindowProps extends PropsWithChildren {
  title?: string;
  theme?: TerminalTheme;
  status?: TerminalConnectionStatus;
}

export function TerminalWindow({
  children,
  title = "Terminal",
  theme = "linux",
  status = "connected"
}: TerminalWindowProps) {
  return (
    <section className={`wtk-window wtk-window--${theme}`} aria-label={title}>
      <header className="wtk-titlebar">
        <div className="wtk-controls" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="wtk-title">{title}</div>
        <div className={`wtk-status wtk-status--${status}`}>{status}</div>
      </header>
      <div className="wtk-body">{children}</div>
    </section>
  );
}
