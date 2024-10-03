import { Message } from "../src/models/message";

const token = "123";
const clientWs = new WebSocket("wss://127.0.0.1:8080", [
    "Authorization",
    `Bearer ${12345}`,
]);

const message: Message = {
    roomId: 1,
    sentBy: 1,
    textBody: "hello world2!!!!",
};

clientWs.onopen = () => {
    console.log("sent message");
    clientWs.send(JSON.stringify(message));
};

clientWs.onerror = (error) => {
    console.error(error);
};

clientWs.onmessage = (message) => {
    console.log(`message received`, message.data);
};
