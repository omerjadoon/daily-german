# Daily German B1 Email Tutor 🇩🇪✈️

An intelligent, deploy-ready, full-stack German-learning application built on Netlify and Supabase. The app sends one engaging, progressive, and level-appropriate daily lesson email directly to your inbox to prepare you for the **telc Deutsch B1 exam** as fast as realistically possible.

---

## 1. What the App Does
The Daily German B1 Email Tutor is an automated pedagogical system designed to build daily learning consistency. Each day, the app calculates your current curriculum day number based on your `START_DATE`. It picks a targeted topic mapping a progressive CEFR scale (A0 to B1), generates or retrieves a high-quality story-based lesson via Groq LLM, validates the output structural rules via Zod, and sends a beautiful responsive newsletter directly to your inbox using Resend.

---

## 2. How the Learning System Works
The tutoring curriculum spans **120 days** of progressive German education:
*   **Days 1–10:** Absolute beginner level (A0 survival phrases, simple sentence orders, greetings, letters). Very short sentences, no subordinate clauses, detailed English assistance.
*   **Days 11–30:** Basic daily life (A1 level). Introduces modal verbs, accusative articles, daily time telling, and shopping dialogue.
*   **Days 31–60:** Structured routine (A1+/A2 level). Accusative/dative cases, separable verbs, and introduction to the Perfekt past tense.
*   **Days 61–85:** Storytelling and opinion (A2 level). Multi-clause reasoning (`weil`, `dass`, `wenn`), two-way prepositions, and polite requests.
*   **Days 86–120:** telc B1 Exam Prep. Intensive mock-exam training covering all three Speaking parts, written complaint letters, formal/informal request formats, genitive prepositions, passive voice, and concessions (`obwohl`, `trotzdem`).
*   **Spaced Repetition Integration:** Each day, the database queries 5 vocabulary items you learned on previous days (prioritizing nouns and due/forgotten terms) and requests the AI tutor to test you on them in a "Spaced Repetition Review" section.

---

## 3. Tech Stack
*   **Core:** React with TypeScript, Vite
*   **Styling:** Premium Vanilla CSS (dark-themed, glassmorphic layout)
*   **Database:** Supabase PostgreSQL database
*   **Backend:** Netlify Functions (Serverless TypeScript APIs)
*   **Scheduling:** Netlify Scheduled Functions (Cron engine)
*   **Generative AI:** Groq SDK (running `llama-3.3-70b-versatile` by default)
*   **Email Delivery:** Resend Node SDK
*   **Validation:** Zod
*   **Database Access:** `postgres.js` (pure client driver with SSL)

---

## 4. Project Structure
```text
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database tables & performance indexes
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx          # Master layout hub
│   │   ├── StatusCard.tsx         # Today's status & manual control forms
│   │   ├── LessonPreview.tsx      # Tabbed mirror of today's actual email
│   │   ├── RecentLessons.tsx      # Sent email history log table
│   │   └── RecentVocabulary.tsx   # Word library with spaced repetition details
│   ├── data/
│   │   ├── curriculum.json        # 120-day progressive topic registry
│   │   ├── grammar-plan.json      # Grammar CEFR references
│   │   └── vocabulary-themes.json # Vocabulary CEFR categories
│   ├── lib/
│   │   ├── db.ts                  # postgres.js pool client with env parser
│   │   ├── groq.ts                # Groq API client with strict JSON mode
│   │   ├── resend.ts              # Resend email client driver
│   │   ├── dates.ts               # Timezone-safe progression dates
│   │   ├── progression.ts         # Pedagogy rules and CEFR filters
│   │   ├── reviewWords.ts         # Spaced repetition logic & update schedulers
│   │   ├── validation.ts          # Zod schema definitions
│   │   ├── lessonPrompt.ts        # Dynamic prompt compiler
│   │   ├── emailTemplate.ts       # HTML & text email rendering
│   │   └── lessonService.ts       # Full core service orchestrator
│   ├── App.tsx                    # Main React container
│   ├── main.tsx                   # React Vite entry point
│   └── index.css                  # Modern dark-mode glassmorphic stylesheet
├── netlify/
│   └── functions/
│       ├── send-daily-lesson.ts   # Scheduled daily cron trigger (6 AM)
│       ├── send-test-lesson.ts    # Authenticated test email dispatch
│       ├── send-today-manual.ts   # Authenticated manual today's email trigger
│       ├── preview-lesson.ts      # HTTP preview JSON generator
│       ├── lesson-status.ts       # HTTP endpoint returning current state
│       ├── recent-lessons.ts      # Returns last 10 sent rows
│       └── recent-vocabulary.ts   # Returns recently generated vocabulary
├── scripts/
│   └── seed-curriculum.ts         # Idempotent topics loader script
├── netlify.toml                   # Build directions & Scheduled function mapping
├── package.json                   # Build scripts & node dependencies
├── tsconfig.json                  # strict TypeScript rules
├── vite.config.ts                 # Vite bundler configurations
└── .env.example                   # Local configuration template
```

---

## 5. Prerequisites
*   Node.js v18 or v20+
*   A Supabase Account (Free tier is perfect)
*   A Groq Console Account (Free API keys available)
*   A Resend Account (Free tier allows sending to your registered email)
*   Netlify CLI installed globally (`npm install -g netlify-cli`)

---

## 6. How to Create a Groq API Key
1.  Go to [console.groq.com](https://console.groq.com/) and register or log in.
2.  Navigate to the **API Keys** section in the left sidebar.
3.  Click **Create API Key**, name it `daily-german-key`, and copy the resulting secret token starting with `gsk_`.

---

## 7. How to Create a Resend API Key
1.  Sign up at [resend.com](https://resend.com/).
2.  On the dashboard, click **API Keys** in the navigation menu.
3.  Click **Create API Key**, check **Sending Access** permission, and click **Create**.
4.  Copy the token starting with `re_`.

---

## 8. How to Verify a Resend Sending Domain
1.  On the Resend Dashboard, go to **Domains**.
2.  Click **Add Domain**, enter your custom domain (e.g. `your-verified-domain.com`).
3.  Copy the generated **TXT and MX DNS records**.
4.  Log into your domain provider (e.g. Namecheap, GoDaddy, Cloudflare) and add the records to your DNS settings.
5.  Wait a few minutes, click **Verify** on Resend. Once verified, you can send emails from `learning@your-verified-domain.com`.
6.  *Note:* If you do not verify a domain, you can send emails using `onboarding@resend.dev` as the sender, but you are strictly limited to sending emails *only* to the single address you used to register your Resend account.

---

## 9. How to Create or Use the Supabase Database
1.  Create a project at [supabase.com](https://supabase.com/).
2.  Once created, navigate to **Project Settings** -> **Database**.
3.  Find the **Connection string** section, click **URI**, and copy it. It will look like:
    `postgresql://postgres:[YOUR-PASSWORD]@db.feufbmtzaekrbwrzjhfl.supabase.co:5432/postgres`

---

## 10. How to Configure DATABASE_URL
1.  Replace `[YOUR-PASSWORD]` in your connection string with the actual password you chose when creating your Supabase project.
2.  Make sure to wrap the URL in quotes inside your `.env` or Netlify variables list:
    `DATABASE_URL="postgresql://postgres:MySecurePassword123!@db.feufbmtzaekrbwrzjhfl.supabase.co:5432/postgres"`

---

## 11. How to Run the Migration in Supabase SQL Editor
1.  Open your Supabase dashboard and click **SQL Editor** in the left sidebar.
2.  Click **New query**.
3.  Copy all the contents from `/supabase/migrations/001_initial_schema.sql` and paste them into the editor window.
4.  Click **Run**. You will see a success message indicating all 6 tables and 5 indexes were successfully created.

---

## 12. How to Seed Curriculum Topics with `npm run seed`
1.  Open a terminal in the root folder of the project.
2.  Create your `.env` file and make sure `DATABASE_URL` is set correctly.
3.  Run the command:
    ```bash
    npm run seed
    ```
4.  The terminal will output the progress and print a success message once all 120 days are loaded idempotently.

---

## 13. How to Configure Local `.env`
Create a `.env` file in the root folder of the project. Fill in the values like in env.example.

---

## 14. How to Run Locally with `netlify dev`
We use `netlify dev` to run the React frontend and the backend serverless functions concurrently:
1.  Run the Netlify CLI:
    ```bash
    netlify dev
    ```
2.  This spins up a local proxy server at `http://localhost:8888` which serves your beautiful dashboard and routes all `/.netlify/functions/*` requests seamlessly!

---

## 15. How to Deploy to Netlify
1.  Create a new repository on GitHub and commit all code (make sure `.env` is NOT committed!).
2.  Go to the [Netlify Dashboard](https://app.netlify.com/) and click **Add new site** -> **Import from Git**.
3.  Select your GitHub repository.
4.  Netlify will automatically detect `netlify.toml` build commands. Click **Deploy site**.

---

## 16. How to Configure Netlify Environment Variables
1.  On the Netlify project site page, click **Site configuration** -> **Environment variables**.
2.  Click **Add a variable** and add all the environment variables from your `.env` file:
    *   `DATABASE_URL`
    *   `GROQ_API_KEY`
    *   `GROQ_MODEL`
    *   `RESEND_API_KEY`
    *   `EMAIL_FROM`
    *   `EMAIL_TO`
    *   `APP_TIMEZONE`
    *   `START_DATE`
    *   `MANUAL_SEND_SECRET`

---

## 17. How to Test Preview Lesson
1.  Open the local browser dashboard (`http://localhost:8888`).
2.  Under **Beliebigen Tag vorschauen**, type the target day number you want to preview (e.g. `12`).
3.  Click **Laden**.
4.  The dashboard will render the generated German text, English translation, vocabulary list, grammar rules, and exercises immediately! No emails are sent.

---

## 18. How to Send a Test Email
1.  Open the local dashboard and locate the **Admin-Authentifizierung** card.
2.  Input your configured `MANUAL_SEND_SECRET`.
3.  Under the **Test-E-Mail senden** card, input the day number you want to send.
4.  Click **Test senden**. Check your inbox! A gorgeous, mobile-responsive HTML mail with the subject `[TEST] Day X German: ...` will arrive.

---

## 19. How to Manually Send Today’s Email
1.  Enter your `MANUAL_SEND_SECRET` in the dashboard.
2.  Click **Heute abschicken** on the manual send trigger.
3.  The backend will fetch today's lesson, verify that an email for today hasn't been sent yet, send it, and log the success. If you click it a second time, it will block sending to prevent duplicating today's lesson.

---

## 20. How to Change Recipient Email
1.  Simply change the `EMAIL_TO` variable in your `.env` or Netlify Environment Variables panel and restart the server / trigger new redeployments.

---

## 21. How to Change Sender Email
1.  Ensure you have verified your custom domain in Resend.
2.  Modify the `EMAIL_FROM` environment variable:
    `EMAIL_FROM="German Tutor <learning@my-new-domain.de>"`

---

## 22. How to Change Groq Model
By default, the app uses `llama-3.3-70b-versatile` which is fast, cost-effective, and highly intelligent. If you wish to change models (e.g., to run `mixtral-8x7b-32768` or smaller previews), set `GROQ_MODEL` in your environment.

---

## 23. How to Change Daily Schedule
The daily cron schedule is defined in `netlify.toml`:
```toml
[functions."send-daily-lesson"]
  schedule = "0 6 * * *"
```
This triggers at 06:00 AM UTC. If you want it delivered at 08:00 AM Berlin local time:
*   In summer (CEST is UTC+2), 08:00 AM is 06:00 AM UTC (`0 6 * * *`).
*   In winter (CET is UTC+1), 08:00 AM is 07:00 AM UTC (`0 7 * * *`).
You can change the cron parameter accordingly in `netlify.toml`.

---

## 24. How to Add More Curriculum Topics
To expand the curriculum beyond 120 days:
1.  Add new entries to `src/data/curriculum.json` following the exact JSON block structure.
2.  Run `npm run seed` again. The database upserts new rows without touching old days!

---

## 25. How Duplicate-Send Protection Works
Before sending any daily lesson email, `lessonService.ts` queries the `sent_lessons` table for a record matching the combination of `day_number` + `email_to` + `status = 'sent'`.
*   If found, the send process aborts, writing a `duplicate_send_prevented` log in `lesson_events` to keep you safe.
*   Test sends write under `status = 'test_sent'`, which does not interfere with standard protection filters.

---

## 26. Troubleshooting
*   **Zod Mismatches:** If the Groq output is ever corrupted, the auto-repair function sends the error logs back to the LLM for self-correction. If that still fails, a local emergency fallback lesson (Day-customized) loads instantly so your daily email is never skipped.
*   **Database URL Error:** If connection times out, verify that your Supabase instance is active and that your local IP or Netlify is not blocked. Enforce that `DATABASE_URL` contains `ssl="require"` (fully configured in `db.ts`).
*   **Netlify dev fails to load backend:** Make sure you installed the Netlify CLI (`npm install -g netlify-cli`) and that you run `netlify dev` (rather than standard `npm run dev`) to proxy both ports.

---

## 27. Security Notes
*   **Never commit `.env` files** containing database passwords or API keys to Git.
*   Ensure `MANUAL_SEND_SECRET` is strong and long to prevent unauthorized admin access.
*   Database connections use strict SSL requirements so credentials are never sent as cleartext.
*   Never log DATABASE_URL or API keys in standard output streams or Supabase logs.
*   Rotate Groq/Resend keys immediately if they are accidentally leaked.
