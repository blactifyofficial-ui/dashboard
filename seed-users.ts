import { db } from "./src/db";
import { allowedUsers } from "./src/db/schema";
import { v4 as uuidv4 } from "uuid";

async function main() {
  const users = [
    { id: uuidv4(), email: "nithinnt07@gmail.com" },
    { id: uuidv4(), email: "blactifyofficial@gmail.com" }
  ];

  for (const u of users) {
    try {
      await db.insert(allowedUsers).values(u).onConflictDoNothing();
      console.log(`Inserted ${u.email}`);
    } catch (e) {
      console.error(e);
    }
  }
}

main();
