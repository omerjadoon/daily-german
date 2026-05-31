import { Handler } from "@netlify/functions";
import { getLessonStatus } from "../../src/lib/lessonService";

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

  try {
    const status = await getLessonStatus();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(status),
    };
  } catch (error: any) {
    console.error("Lesson status function failed:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Failed to retrieve today's lesson status",
        details: error.message || error
      }),
    };
  }
};
