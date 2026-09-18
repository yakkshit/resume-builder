import dotenv from 'dotenv';
dotenv.config();

async function testFcukOffAI() {
  const apiKey = process.env.CEDZ_LLM_API;
  if (!apiKey) {
    console.error("No CEDZ_LLM_API found in .env");
    return;
  }

  const endpoint = "https://api.fcukoffai.com/v1/chat/completions";
  const model = "cedz-hr-qwen";
  
  console.log(`Testing ${model} on ${endpoint}...`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: "You are a resume assistant. Emit a component block for the resume." },
        { role: "user", content: "Can you create a mock resume using a component block?" }
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    console.error(`API Error: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.error(text);
    return;
  }

  console.log("Stream connected! Reading response...");
  const reader = response.body?.getReader();
  if (!reader) return;
  
  let partial = "";
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = (partial + chunk).split("\n");
    partial = lines.pop() || "";
    
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const text = json.choices[0]?.delta?.content;
          if (text) {
            process.stdout.write(text);
          }
        } catch (e) { 
          // ignore parsing errors
        }
      }
    }
  }
  console.log("\n\nTest completed!");
}

testFcukOffAI().catch(console.error);
