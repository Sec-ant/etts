import { escapeHTML } from "bun";

const WebSocketBun = WebSocket;

export { WebSocketBun as WebSocket, escapeHTML as escapeXML };
