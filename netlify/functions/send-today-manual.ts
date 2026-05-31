import { Handler } from "@netlify/functions";
import { sendTodayManual } from "../../src/lib/lessonService";

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

  // Parse secret from request parameters
  let secret = event.headers["x-manual-send-secret"] || event.queryStringParameters?.secret;
  
  if (event.body) {
    try {
      const bodyData = JSON.parse(event.body);
      if (bodyData.secret) secret = bodyData.secret;
    } catch (e) {
      // Ignored
    }
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

  try {
    const result = await sendTodayManual();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error("Manual send today function failed:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Failed to dispatch today's email manually",
        details: error.message || error
      }),
    };
  }
};
