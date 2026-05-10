import fetch from "node-fetch";

const key = "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";

async function run() {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [{ role: "user", content: "hello" }]
        })
      });
      console.log(i, res.status, await res.text());
    } catch (e) {
      console.error(i, "Error:", e.message);
    }
  }
}
run();
