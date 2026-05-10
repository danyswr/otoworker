import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI("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");
async function run() {
  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("hello");
    console.log(result.response.text());
  } catch (e) {
    console.error("Gemini SDK Error:", e.message);
  }
}
run();
