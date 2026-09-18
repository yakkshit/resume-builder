import dotenv from 'dotenv';
dotenv.config();

async function testLarge() {
  const apiKey = process.env.CEDZ_LLM_API;
  const endpoint = "https://api.fcukoffai.com/v1/chat/completions";
  const model = "cedz-hr-qwen";
  
  // Create a large system message ~100,000 characters
  const largeSystemMessage = "This is a test of a very large system message. ".repeat(2000);
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: largeSystemMessage },
        { role: "user", content: "hi" }
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    console.error(`API Error: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.error("Response body:", text);
    return;
  }
  console.log("Success with large system message");
}

testLarge().catch(console.error);
