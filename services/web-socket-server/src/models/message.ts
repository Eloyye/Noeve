import { date, number, string, z } from "zod";
import { identityZodType, Identity } from "./utils";

export const MessageZ = z.object({
    sentBy: number(),
    roomId: number(),
    creationDate: date().optional(),
    textBody: string(),
});

export type Message = z.infer<typeof MessageZ>;

export type MessageWithId = { id: Identity } & Message;

// interface Message {
//     id?: Identity;
//     sentBy: Identity;
//     creationDate: Date;
//     roomId: Identity;
//     textBody: string;
// }
