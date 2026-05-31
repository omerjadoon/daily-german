import { Handler } from "@netlify/functions";
import { sendTestLesson } from "../../src/lib/lessonService";

export const handler: Handler = async (event, context) => {
  // CORS Preflight request handling
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, x-manual-send-secret",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      } as any,
      body: "",
    };
  }

  // Parse fields safely from Headers, Body, or Query
  let secret = event.headers["x-manual-send-secret"] || event.queryStringParameters?.secret;
  let dayOverride: number | null = null;
  
  if (event.body) {
    try {
      const bodyData = JSON.parse(event.body);
      if (bodyData.secret) secret = bodyData.secret;
      if (bodyData.day) dayOverride = parseInt(bodyData.day);
    } catch (e) {
      // Non-JSON or malformed body
    }
  }

  const queryDay = event.queryStringParameters?.day;
  if (queryDay) {
    dayOverride = parseInt(queryDay);
  }

  const expectedSecret = process.env.MANUAL_SEND_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Unauthorized: Invalid or missing manual send secret." }),
    };
  }

  if (dayOverride === null || isNaN(dayOverride) || dayOverride < 1) {
    dayOverride = 1; // Default fallback to day 1
  }

  try {
    const result = await sendTestLesson(dayOverride);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: `Test lesson for day ${dayOverride} sent successfully!`,
        ...result
      }),
    };
  } catch (error: any) {
    console.error("Test send function failed:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Failed to dispatch test email",
        details: error.message || error
      }),
    };
  }
};
