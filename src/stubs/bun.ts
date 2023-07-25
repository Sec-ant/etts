import { escapeHTML as escapeHtml } from "bun";

const WebSocketBun = WebSocket;

export { WebSocketBun as WebSocket, escapeHtml as escapeXml };
