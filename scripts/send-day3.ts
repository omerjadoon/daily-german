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
  const { sendDailyLesson } = await import("../src/lib/lessonService");

  console.log("🚀 Triggering Day 3 lesson send...");
  try {
    const result = await sendDailyLesson();
    if (result.alreadySent) {
      console.log(`⚠️  Email for Day ${result.dayNumber} was already sent today. Skipping.`);
    } else {
      console.log(`✅ Email sent! Day ${result.dayNumber}`);
      console.log(`   Subject: ${result.lesson?.subject}`);
      console.log(`   Topic:   ${result.lesson?.topic}`);
      console.log(`   Level:   ${result.lesson?.level}`);
      console.log(`   Message ID: ${result.messageId}`);
    }
  } catch (err) {
    console.error("❌ Send failed:", err);
  }
}

run();
