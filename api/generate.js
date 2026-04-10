
Copy

export const config = {
  maxDuration: 60,
};
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method not allowed' }); }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { return res.status(500).json({ error: 'API key not configured.' }); }
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const body = { ...req.body };
    delete body.tools;
    body.stream = true;
    body.max_tokens = 6000;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json();
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.error?.message || 'API error ' + response.status })}\n\n`);
      res.end(); return;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
            res.write(`data: ${JSON.stringify({ type: 'text', text: json.delta.text })}\n\n`);
          }
          if (json.type === 'message_stop') {
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
          }
        } catch (e) {}
      }
    }
    res.end();
  } catch (err) {
    try { res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'Server error' })}\n\n`); res.end(); } catch (e) {}
  }
}
