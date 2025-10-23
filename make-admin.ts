import { getDb } from "./server/db";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function makeAdmin(email: string) {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    const result = await db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.email, email));

    console.log(`✅ User ${email} is now an admin`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  process.exit(0);
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: tsx make-admin.ts <email>");
  process.exit(1);
}

makeAdmin(email);

