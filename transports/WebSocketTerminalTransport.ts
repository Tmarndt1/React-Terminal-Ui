import {
  TerminalConnectionStatus,
  TerminalResize,
  TerminalTransport,
  TerminalTransportEvents
} from "../types";

type IncomingMessage =
  | { type: "data"; payload: string }
  | { type: "status"; payload: TerminalConnectionStatus }
  | { type: "title"; payload: string };

interface WebSocketTransportOptions {
  url: string;
  protocols?: string | string[];
}

export class WebSocketTerminalTransport implements TerminalTransport {
  private readonly options: WebSocketTransportOptions;
  private socket: WebSocket | null = null;

  constructor(options: WebSocketTransportOptions) {
    this.options = options;
  }

  connect(events: TerminalTransportEvents): void {
    events.onStatus?.("connecting");
    this.socket = new WebSocket(this.options.url, this.options.protocols);

    this.socket.addEventListener("open", () => {
      events.onStatus?.("connected");
    });

    this.socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(String(event.data)) as IncomingMessage;

        if (message.type === "data") {
          events.onData?.(message.payload);
        }

        if (message.type === "status") {
          events.onStatus?.(message.payload);
        }

        if (message.type === "title") {
          events.onTitle?.(message.payload);
        }
      } catch (error) {
        events.onError?.(
          error instanceof Error ? error : new Error("Unable to parse terminal message.")
        );
      }
    });

    this.socket.addEventListener("error", () => {
      events.onStatus?.("error");
      events.onError?.(new Error("WebSocket terminal transport failed."));
    });

    this.socket.addEventListener("close", () => {
      events.onStatus?.("disconnected");
    });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  send(input: string): void {
    this.socket?.send(JSON.stringify({ type: "input", payload: input }));
  }

  resize(size: TerminalResize): void {
    this.socket?.send(JSON.stringify({ type: "resize", payload: size }));
  }
}
