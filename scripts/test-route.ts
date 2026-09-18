import dotenv from 'dotenv';
dotenv.config();

const getMsgText = (m: any) =>
  m.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") ?? m.content ?? ""

async function run() {
  const apiKey = process.env.CEDZ_LLM_API;
  const endpoint = "https://api.fcukoffai.com";
  const model = "cedz-hr-qwen";
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  }

  // Simulate exactly what route.ts sends
  const messages = [
    { role: "system", content: "You are a resume assistant." },
    { role: "user", content: "help" }
  ];

  const response = await fetch(`${endpoint}/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model,
      messages: messages.map(msg => ({
        role: msg.role === "system" ? "system" : msg.role === "assistant" ? "assistant" : "user",
        content: getMsgText(msg) || " ",
      })),
      stream: true,
    }),
  })

  if (!response.ok) {
    console.error(`API Error: ${response.status}`);
    const text = await response.text();
    console.error("Response:", text);
  } else {
    console.log("OK 200");
  }
}

run().catch(console.error);
