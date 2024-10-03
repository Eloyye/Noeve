import { WebSocketServer } from "ws";

import * as http from "node:http";
import { MessageWithId, MessageZ } from "./models/message";
import { Identity } from "./models/utils";

import { WebSocket } from "ws";
import { sendMessageToDb } from "./db/db";

type WebSocketContext = { userId: Identity };

export class ChatWebSocketServer {
    private wss: WebSocketServer;
    private server: http.Server;
    private idToWebsockets: Map<Identity, WebSocket>;
    constructor() {
        this.server = http.createServer();
        this.wss = new WebSocketServer({ noServer: true });
        this.idToWebsockets = new Map<Identity, WebSocket>();
    }

    private handleOnError(error: Error) {
        console.error(error);
    }

    private wsEventHandler() {
        const onConnectionHandler = (
            ws: WebSocket,
            request: http.IncomingMessage,
            context: WebSocketContext,
        ) => {
            ws.on("error", this.handleOnError);
            ws.on("message", this.handleOnMessage(ws));
        };

        this.wss.on("connection", onConnectionHandler);
    }

    private upgradeHandler() {
        this.server.on("upgrade", (request, socket, head) => {
            socket.on("error", (error) => {
                console.error(error);
            });
            console.log("parsing session from request");
            //     TODO: Handle Authorization
            type socketType = typeof socket;
            const setUnauthorizedAccess = (socket: socketType) => {
                socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
                socket.destroy();
                console.error("unauthorized request without header");
            };
            const protocols = request.headers["sec-websocket-protocol"];
            if (!protocols) {
                setUnauthorizedAccess(socket);
                return;
            }

            console.log(`protocol: ${protocols}`);

            const [headerName, bearerToken] = protocols.split(", ");

            if (!bearerToken) {
                setUnauthorizedAccess(socket);
                return;
            }
            const token = request.headers.authorization!.replace("Bearer ", "");
            console.log(`Received token: ${token}`);
            this.wss.handleUpgrade(request, socket, head, (ws) => {
                // Context is necessary to have information about the websocket itself
                // TODO: Remove this
                const context: WebSocketContext = { userId: 1421 };
                this.wss.emit("connection", ws, request, context);
            });
        });
    }

    listen(port: number, hostname = "127.0.0.1") {
        this.wsEventHandler();
        this.upgradeHandler();
        this.server.listen(port, hostname, () => {
            console.log(`Listening to localhost at PORT ${port}`);
        });
    }

    private handleOnMessage(ws: WebSocket) {
        return async (data: string) => {
            console.log("received: %s", data);
            try {
                const message = MessageZ.parse(JSON.parse(data));
                const res = await sendMessageToDb(message);
                const messageWithId = { ...message, id: res.messageId };
                this.fanoutMessageToUsers(res.ids, messageWithId);
                ws.send(
                    JSON.stringify({
                        message: "successful fanout to users",
                    }),
                );
                console.log("sent fanout to users");
            } catch (e) {
                // Terminate connection as out of norm
                console.error(`Error: ${e}`);
                ws.close(1007, "Unable to parse data");
                return;
            }
        };
    }

    private fanoutMessageToUsers(
        userIdsInRoom: Identity[],
        message: MessageWithId,
    ) {
        // TODO: Scaling purposes -> send it to event emitter service to broadcast to right server
        userIdsInRoom.forEach((id) => {
            if (this.idToWebsockets.has(id)) {
                const targetWs = this.idToWebsockets.get(id);
                targetWs!.send(JSON.stringify(message));
            }
        });
    }
}
