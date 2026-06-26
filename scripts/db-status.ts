import fs from "fs";
import path from "path";

try {
  const envPath = path.resolve(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[k] = v;
  }
} catch {}

async function run() {
  const { sql } = await import("../src/lib/db");
  const { getCurrentDayNumber } = await import("../src/lib/dates");
  const { getTopicForDay } = await import("../src/lib/curriculum");

  const day = getCurrentDayNumber();
  const topic = getTopicForDay(day);

  const dbTime = await sql`SELECT NOW()`;
  const sent   = await sql`SELECT count(*) FROM sent_lessons`;
  const gen    = await sql`SELECT count(*) FROM generated_lessons`;
  const voc    = await sql`SELECT count(*) FROM vocabulary_items`;

  console.log("✅ DB is LIVE:", dbTime[0].now);
  console.log(`📅 Today = Day ${day} — ${topic.topic} (${topic.level})`);
  console.log(`📬 sent_lessons:      ${sent[0].count}`);
  console.log(`📝 generated_lessons: ${gen[0].count}`);
  console.log(`📖 vocabulary_items:  ${voc[0].count}`);

  await sql.end();
}

run();
