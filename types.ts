export type TerminalTheme = "windows" | "linux";

export type TerminalConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface TerminalLine {
  id: string;
  text: string;
  kind?: "output" | "input" | "system";
}

export interface TerminalSubmitEvent {
  input: string;
  prompt: string;
}

export interface TerminalResize {
  cols: number;
  rows: number;
}

export interface TerminalTransportEvents {
  onData?: (chunk: string) => void;
  onStatus?: (status: TerminalConnectionStatus) => void;
  onTitle?: (title: string) => void;
  onError?: (error: Error) => void;
}

export interface TerminalTransport {
  connect: (events: TerminalTransportEvents) => void | Promise<void>;
  disconnect?: () => void | Promise<void>;
  send: (input: string) => void | Promise<void>;
  resize?: (size: TerminalResize) => void | Promise<void>;
}

export interface TerminalTranscript {
  lines: TerminalLine[];
}
