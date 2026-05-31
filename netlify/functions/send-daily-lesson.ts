import { Handler, schedule } from "@netlify/functions";
import { sendDailyLesson } from "../../src/lib/lessonService";

const myHandler: Handler = async (event, context) => {
  console.log("Daily German Scheduled Function Triggered.");
  try {
    const result = await sendDailyLesson();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Scheduled function completed successfully.",
        ...result
      }),
    };
  } catch (error: any) {
    console.error("Scheduled execution failed:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Scheduled execution failed",
        details: error.message || error
      }),
    };
  }
};

// Schedule format: "0 6 * * *" = 6:00 AM UTC daily
export const handler = schedule("0 6 * * *", myHandler);
