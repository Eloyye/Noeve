import { Identity } from "./utils";

interface Room {
    id: Identity;
    createdBy: Identity;
    dateCreated: Date;
    roomName: string;
}
