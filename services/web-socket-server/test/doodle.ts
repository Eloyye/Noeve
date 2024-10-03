import sql from "../src/db/db";

async function main() {
    const query = await sql.begin((sql) => [
        sql`SELECT * FROM users WHERE user_id=10;`,
    ]);
    console.log(query[0].length);
}

main().then(() => {
    console.log("finished");
});
