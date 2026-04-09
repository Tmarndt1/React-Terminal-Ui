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
  private cleanup: Array<() => void> = [];

  constructor(options: WebSocketTransportOptions) {
    this.options = options;
  }

  connect(events: TerminalTransportEvents): void {
    this.disconnect();
    events.onStatus?.("connecting");
    const socket = new WebSocket(this.options.url, this.options.protocols);
    this.socket = socket;

    const handleOpen = () => {
      events.onStatus?.("connected");
    };

    const handleMessage = (event: MessageEvent) => {
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
    };

    const handleError = () => {
      events.onStatus?.("error");
      events.onError?.(new Error("WebSocket terminal transport failed."));
    };

    const handleClose = () => {
      events.onStatus?.("disconnected");
    };

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("error", handleError);
    socket.addEventListener("close", handleClose);

    this.cleanup = [
      () => socket.removeEventListener("open", handleOpen),
      () => socket.removeEventListener("message", handleMessage),
      () => socket.removeEventListener("error", handleError),
      () => socket.removeEventListener("close", handleClose)
    ];
  }

  disconnect(): void {
    this.cleanup.forEach((cleanup) => cleanup());
    this.cleanup = [];
    this.socket?.close();
    this.socket = null;
  }

  send(input: string): void {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify({ type: "input", payload: input }));
  }

  resize(size: TerminalResize): void {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify({ type: "resize", payload: size }));
  }
}
