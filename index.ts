export { TerminalSurface } from "./components/TerminalSurface";
export { TerminalWindow } from "./components/TerminalWindow";
export { useTerminalSession } from "./hooks/useTerminalSession";
export { WebSocketTerminalTransport } from "./transports/WebSocketTerminalTransport";
export { createStaticTranscript } from "./utils/terminalBuffer";
export type {
  TerminalConnectionStatus,
  TerminalLine,
  TerminalResize,
  TerminalTheme,
  TerminalTranscript,
  TerminalTransport,
  TerminalTransportEvents
} from "./types";
import "./styles.css";
