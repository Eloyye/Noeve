import { Message } from "../models/message";
import { Identity } from "../models/utils";

// db.js
import postgres from "postgres";

export const sql = postgres({
    /* options */
    host: "127.0.0.1",
    port: 5432,
    database: "noevedb",
    username: "postgres",
    password: "1234",
}); // will use psql environment variables

export default sql;

interface MessageDbResponse {
    ids: Identity[];
    messageId: Identity;
}

export async function sendMessageToDb(
    message: Message,
): Promise<MessageDbResponse> {
    // Send one statement doing two queries to save RTT to database. First updating user and second getting the values of id.
    const queries = await sql.begin(async (sql) => {
        console.log(`roomId: ${message.roomId}, user_id: ${message.sentBy}`);
        // await sql`DO $$ DECLARE row_exists BOOLEAN; BEGIN SELECT EXISTS( SELECT 1 FROM tenants WHERE tenants.user_id = ${message.sentBy}::integer AND tenants.room_id = ${message.roomId}::integer FOR UPDATE ) INTO row_exists; IF NOT row_exists THEN RAISE EXCEPTION 'NO_DATA_FOUND' USING MESSAGE = 'PROVIDED INVALID TENANT'; END IF; END $$;`;

        const insertResult = await sql`
        INSERT INTO messages (sent_by_userid, body, room_id) 
        VALUES (${message.sentBy}, ${message.textBody}, ${message.roomId}) 
        RETURNING message_id;
    `;

        const selectResult = await sql`
        SELECT user_id FROM tenants 
        LEFT JOIN rooms ON tenants.room_id = rooms.room_id 
        WHERE rooms.room_id = ${message.roomId} 
        AND tenants.user_id <> ${message.sentBy};
    `;

        return [insertResult, selectResult];
    });
    return {
        messageId: queries[0][0].message_id,
        ids: queries[1].map((objId) => objId.user_id),
    };
}
