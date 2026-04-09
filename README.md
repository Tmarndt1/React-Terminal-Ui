# React Terminal UI

React Terminal UI is a lightweight component library for building browser-based terminal experiences with a polished shell window, transcript rendering, local command capture, and transport-driven remote sessions.

![React Terminal UI demo](./demo-preview.png)

## Highlights

- Typed React components and hooks for local or remote terminal flows
- Built-in shell chrome with Linux and Windows visual themes
- Transport abstraction for WebSocket or custom backends
- Auto-resize support for cols and rows
- Accessibility improvements for focus handling and live transcript updates
- Bundled CSS and TypeScript declarations for library consumers

## Installation

```bash
npm install react-terminal-ui
```

The package expects `react` and `react-dom` as peer dependencies.

## Quick Start

```tsx
import { TerminalSurface } from "react-terminal-ui";
import "react-terminal-ui/styles.css";

export function DemoTerminal() {
  return (
    <TerminalSurface
      title="Local session"
      autoFocus
      welcomeMessage={[
        "React Terminal UI",
        "Type a command and handle it in onSubmit."
      ]}
      onSubmit={({ input }) => {
        console.log("command:", input);
      }}
    />
  );
}
```

## Remote Session Example

```tsx
import {
  TerminalSurface,
  WebSocketTerminalTransport
} from "react-terminal-ui";
import "react-terminal-ui/styles.css";

const transport = new WebSocketTerminalTransport({
  url: "wss://example.com/terminal"
});

export function RemoteTerminal() {
  return (
    <TerminalSurface
      title="Production shell"
      theme="linux"
      transport={transport}
      autoConnect
      autoFocus
    />
  );
}
```

Expected WebSocket messages:

- Incoming `{ "type": "data", "payload": "..." }`
- Incoming `{ "type": "status", "payload": "connected" }`
- Incoming `{ "type": "title", "payload": "Terminal title" }`
- Outgoing `{ "type": "input", "payload": "..." }`
- Outgoing `{ "type": "resize", "payload": { "cols": 120, "rows": 30 } }`

## API

### `TerminalSurface`

Primary interactive component.

Key props:

- `transport`: optional remote transport implementation
- `welcomeMessage`: string or string array rendered as system lines
- `prompt`: prompt prefix for local sessions, defaults to `$`
- `theme`: `"linux"` or `"windows"`
- `autoConnect`: connect a transport on mount, defaults to `true`
- `autoFocus`: focus the terminal region on mount
- `maxLines`: transcript limit, defaults to `1000`
- `onSubmit`: callback for local command submission
- `screenReaderLabel`: accessible label for the interactive region

### `TerminalWindow`

Shell frame component if you want to render your own body content inside the same chrome.

### `useTerminalSession`

Hook for custom terminal UIs when you want to reuse the session state machine without the stock renderer.

### `WebSocketTerminalTransport`

Ready-made transport for JSON message based WebSocket backends.

## Development

```bash
npm install
npm run check
npm run test
npm run build
```

`prepublishOnly` runs the full verification pipeline before publishing.

## Publishing Notes

- Update the package name if `react-terminal-ui` is not the final npm name you want to reserve
- Confirm the repository URLs in `package.json`
- Run `npm publish` after `npm run check`, `npm run test`, and `npm run build` pass

## License

MIT
