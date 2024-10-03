import { ChatWebSocketServer } from "./chat-wss";

const wss = new ChatWebSocketServer();
wss.listen(8080);
