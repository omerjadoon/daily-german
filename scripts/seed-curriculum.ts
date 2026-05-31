import { sql } from "../src/lib/db";
import fs from "fs";
import path from "path";

interface CurriculumTopic {
  day: number;
  level: string;
  topic: string;
  scenario: string;
  grammarFocus: string[];
  vocabularyTheme: string;
  telcSkill: string;
}

async function seed() {
  try {
    console.log("--- Starting Curriculum Seeding ---");
    const filePath = path.resolve(process.cwd(), "src/data/curriculum.json");
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Curriculum source file not found at: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const topics: CurriculumTopic[] = JSON.parse(fileContent);

    console.log(`Parsed ${topics.length} days of German curriculum from JSON.`);
    console.log("Upserting topics into Supabase...");

    let seededCount = 0;
    
    // We run the upsert sequential or in a transaction. Standard loop is highly robust.
    for (const t of topics) {
      await sql`
        INSERT INTO curriculum_topics (
          day_number, 
          level, 
          topic, 
          scenario, 
          grammar_focus, 
          vocabulary_theme, 
          telc_skill
        ) VALUES (
          ${t.day}, 
          ${t.level}, 
          ${t.topic}, 
          ${t.scenario}, 
          ${t.grammarFocus}, 
          ${t.vocabularyTheme}, 
          ${t.telcSkill}
        )
        ON CONFLICT (day_number) DO UPDATE SET
          level = EXCLUDED.level,
          topic = EXCLUDED.topic,
          scenario = EXCLUDED.scenario,
          grammar_focus = EXCLUDED.grammar_focus,
          vocabulary_theme = EXCLUDED.vocabulary_theme,
          telc_skill = EXCLUDED.telc_skill
      `;
      seededCount++;
    }

    console.log(`Success! Idempotently seeded ${seededCount} topics into 'curriculum_topics'.`);
  } catch (error) {
    console.error("Seeding encountered an error:", error);
    process.exit(1);
  } finally {
    // End the connection pool so the script exits cleanly
    await sql.end();
    console.log("Database connection pool closed.");
    console.log("--- Seeding Finished ---");
  }
}

seed();
