import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  TerminalConnectionStatus,
  TerminalLine,
  TerminalResize,
  TerminalSubmitEvent,
  TerminalTransport
} from "../types";
import { appendChunk, createLine, createStaticTranscript } from "../utils/terminalBuffer";

export interface UseTerminalSessionOptions {
  transport?: TerminalTransport;
  welcomeMessage?: string | string[];
  prompt?: string;
  autoConnect?: boolean;
  maxLines?: number;
  onSubmit?: (event: TerminalSubmitEvent) => void;
}

export interface TerminalSessionState {
  lines: TerminalLine[];
  input: string;
  title: string;
  status: TerminalConnectionStatus;
  setInput: (value: string) => void;
  submitInput: () => void;
  sendInput: (value: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  clear: () => void;
  resize: (size: TerminalResize) => Promise<void>;
}

const DEFAULT_MAX_LINES = 1000;

export function useTerminalSession({
  transport,
  welcomeMessage,
  prompt = "$",
  autoConnect = true,
  maxLines = DEFAULT_MAX_LINES,
  onSubmit
}: UseTerminalSessionOptions): TerminalSessionState {
  const initialLines = useMemo(() => {
    return welcomeMessage ? createStaticTranscript(welcomeMessage) : [];
  }, [welcomeMessage]);

  const [lines, setLines] = useState<TerminalLine[]>(initialLines);
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("Terminal");
  const [status, setStatus] = useState<TerminalConnectionStatus>(transport ? "idle" : "connected");

  useEffect(() => {
    setLines(initialLines);
  }, [initialLines]);

  useEffect(() => {
    if (!transport || !autoConnect) {
      return;
    }

    void connectTransport(transport, setLines, setStatus, setTitle, maxLines);

    return () => {
      void transport.disconnect?.();
    };
  }, [autoConnect, maxLines, transport]);

  const submitInput = () => {
    const submitted = input;

    if (!submitted.trim()) {
      void transport?.send("\r");
      setInput("");
      return;
    }

    const command = `${prompt} ${submitted}`.trim();
    setLines((current) => trimLines([...current, createLine(command, "input")], maxLines));

    if (transport) {
      void transport.send(`${submitted}\r`);
    }

    setInput("");
  };

  const sendInput = (value: string) => {
    if (transport) {
      void transport.send(value);

      if (value === "\u007f") {
        setInput((current) => current.slice(0, -1));
        return;
      }

      if (value === "\t") {
        setInput((current) => current + "    ");
        return;
      }

      if (value.length === 1 && value >= " ") {
        setInput((current) => current + value);
      }

      return;
    }

    setInput((current) => current + value);
  };

  const connect = async () => {
    if (!transport) {
      setStatus("connected");
      return;
    }

    await connectTransport(transport, setLines, setStatus, setTitle, maxLines);
  };

  const disconnect = async () => {
    await transport?.disconnect?.();
    setStatus("disconnected");
  };

  const clear = () => {
    setLines([]);
  };

  const resize = async (size: TerminalResize) => {
    await transport?.resize?.(size);
  };

  return {
    lines,
    input,
    title,
    status,
    setInput,
    submitInput,
    sendInput,
    connect,
    disconnect,
    clear,
    resize
  };
}

async function connectTransport(
  transport: TerminalTransport,
  setLines: Dispatch<SetStateAction<TerminalLine[]>>,
  setStatus: Dispatch<SetStateAction<TerminalConnectionStatus>>,
  setTitle: Dispatch<SetStateAction<string>>,
  maxLines: number
) {
  await transport.connect({
    onData: (chunk) => {
      setLines((current) => trimLines(appendChunk(current, chunk), maxLines));
    },
    onStatus: (nextStatus) => {
      setStatus(nextStatus);
    },
    onTitle: (nextTitle) => {
      setTitle(nextTitle);
    },
    onError: (error) => {
      setStatus("error");
      setLines((current) =>
        trimLines([...current, createLine(`[transport error] ${error.message}`, "system")], maxLines)
      );
    }
  });
}

function trimLines(lines: TerminalLine[], maxLines: number): TerminalLine[] {
  if (lines.length <= maxLines) {
    return lines;
  }

  return lines.slice(lines.length - maxLines);
}
