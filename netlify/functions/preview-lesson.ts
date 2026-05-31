import { Handler } from "@netlify/functions";
import { getOrGenerateLesson } from "../../src/lib/lessonService";
import { getCurrentDayNumber } from "../../src/lib/dates";

export const handler: Handler = async (event, context) => {
  // CORS Preflight request handling
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      } as any,
      body: "",
    };
  }

  // Parse day number from query parameters or default to today's relative day number
  const queryDay = event.queryStringParameters?.day;
  let dayNumber = queryDay ? parseInt(queryDay) : getCurrentDayNumber();

  if (isNaN(dayNumber) || dayNumber < 1) {
    dayNumber = 1;
  }

  try {
    const lesson = await getOrGenerateLesson(dayNumber);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        dayNumber,
        lesson
      }),
    };
  } catch (error: any) {
    console.error(`Preview lesson failed for day ${dayNumber}:`, error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: `Failed to retrieve or generate lesson for day ${dayNumber}`,
        details: error.message || error
      }),
    };
  }
};
