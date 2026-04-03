const { spawn } = require('child_process');
const fs = require('fs');
const localtunnel = require('localtunnel');

(async () => {
  console.log('Booting Webhook Booking Gateway natively on port 3000...');
  const serverProc = spawn('npx', ['tsx', 'src/interfaces/cli/index.ts', 'serve', '--provider', 'mock', '--port', '3000']);
  
  console.log('Opening secure HTTPS tunnel for Vapi Webhook traffic...');
  try {
    const tunnel = await localtunnel({ port: 3000 });
    tunnel.on('error', err => console.error('[TUNNEL WARN] Upstream connection bounce securely caught:', err.message));
    
    console.log(`[TUNNEL] Endpoint bound at: ${tunnel.url}/api/vapi-webhook`);

    const vapiKey = "01959e46-447f-4f90-872d-fa4bc262a8f4";

    const htmlArr = [
      "<!DOCTYPE html>",
      "<html lang='en'>",
      "<head>",
      "    <meta charset='UTF-8'>",
      "    <title>AI Voice Receptionist (Live Booking V2)</title>",
      "    <style>",
      "        body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 40px auto; text-align: center; }",
      "        .status { margin-top: 20px; color: #666; font-size: 18px; }",
      "        .terminal { background: #111; color: #0f0; padding: 20px; border-radius: 5px; font-family: monospace; text-align: left; margin-top: 30px; min-height: 200px; white-space: pre-wrap; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }",
      "    </style>",
      "</head>",
      "<body>",
      "    <h1>Live AI Voice Receptionist Demo</h1>",
      "    <p>Vapi is actively proxying internet tool calls to your exact local machine securely via: <br><b>" + tunnel.url + "/api/vapi-webhook</b></p>",
      "    ",
      "    <div class='status' id='statusMessage'>Initializing secure widget... Look for the button in the bottom right!</div>",
      "    <div class='terminal' id='transcriptLog'>Call Transcript Log:</div>",
      "",
      "    <script>",
      "        (function(d, t) {",
      "          var g = d.createElement(t),",
      "          s = d.getElementsByTagName(t)[0];",
      "          g.src = 'https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js';",
      "          g.defer = true;",
      "          g.async = true;",
      "          s.parentNode.insertBefore(g, s);",
      "",
      "          g.onload = function() {",
      "            window.vapiInstance = window.vapiSDK.run({",
      "              apiKey: '" + vapiKey + "',",
      "              assistant: {",
      "                  name: 'Robotic Dental Receptionist',",
      "                  firstMessage: 'Hello! Thanks for calling the Dental Clinic. Would you like me to check what availability we have?',",
      "                  voice: { provider: 'openai', voiceId: 'alloy' },",
      "                  model: {",
      "                      provider: 'openai',",
      "                      model: 'gpt-4o-mini',",
      "                      systemPrompt: 'You are a professional dental receptionist. You help callers book appointments. Assume today\\'s date revolves around late March 2026. If the user asks for times, STRICTLY use your check_availability tool. Ensure you provide preferredDate string exactly as YYYY-MM-DD (e.g., 2026-03-25). ONLY read back the resulting times the system outputs natively. If they ask to hold or confirm, pretend you can, but primarily simulate the check_availability layer first.',",
      "                      tools: [",
      "                          {",
      "                              type: 'function',",
      "                              function: {",
      "                                  name: 'check_availability',",
      "                                  description: 'Check strictly isolated local appointment slots securely against the Webhook gateway.',",
      "                                  parameters: {",
      "                                      type: 'object',",
      "                                      properties: {",
      "                                          appointmentType: { type: 'string' },",
      "                                          preferredDate: { type: 'string', description: 'Strict format: YYYY-MM-DD' },",
      "                                          timezone: { type: 'string', default: 'America/New_York' }",
      "                                      },",
      "                                      required: ['appointmentType', 'preferredDate', 'timezone']",
      "                                  }",
      "                              },",
      "                              server: {",
      "                                  url: '" + tunnel.url + "/api/vapi-webhook'",
      "                              }",
      "                          }",
      "                      ]",
      "                  }",
      "              },",
      "              config: {",
      "                position: 'bottom-right',",
      "                offset: '40px',",
      "                width: '50px',",
      "                height: '50px'",
      "              }",
      "            });",
      "",
      "            const statusEl = d.getElementById('statusMessage');",
      "            const transcriptLog = d.getElementById('transcriptLog');",
      "            statusEl.innerText = 'Widget online! Click the green button in the corner to start the call.';",
      "",
      "            window.vapiInstance.on('call-start', () => {",
      "                statusEl.innerText = 'Connected! Speak securely into your microphone to trigger the local engine.';",
      "            });",
      "",
      "            window.vapiInstance.on('call-end', () => {",
      "                statusEl.innerText = 'Call gracefully closed.';",
      "            });",
      "",
      "            window.vapiInstance.on('message', (msg) => {",
      "                const nl = String.fromCharCode(10);",
      "                if (msg.type === 'transcript' && msg.transcriptType === 'final') {",
      "                    transcriptLog.innerText += nl + nl + '[' + (msg.role === 'user' ? 'You' : 'AI') + ']: ' + msg.transcript;",
      "                    transcriptLog.scrollTop = transcriptLog.scrollHeight;",
      "                }",
      "                if (msg.type === 'tool-calls') {",
      "                    transcriptLog.innerText += nl + nl + '[SYSTEM - SECURITY]: Routing strict intent intercept via Local Webhook: ' + nl + JSON.stringify(msg.toolWithToolCallList, null, 2);",
      "                    transcriptLog.scrollTop = transcriptLog.scrollHeight;",
      "                }",
      "            });",
      "",
      "            window.vapiInstance.on('error', (e) => {",
      "                statusEl.innerText = 'Framework Error: ' + e.message;",
      "                console.error(e);",
      "            });",
      "          };",
      "        })(document, 'script');",
      "    </script>",
      "</body>",
      "</html>"
    ];

    fs.writeFileSync('v2-demo.html', htmlArr.join(''));
    console.log('✅ Generated v2-demo.html successfully injected with Floating Widget components.');
    
    console.log('\\n🚀 Deploying isolated UI simulation server locally bound natively to port 8005...');
    const pyServer = spawn('python3', ['-m', 'http.server', '8005']);
    
    console.log('\\n======================================================');
    console.log('🎯 SUCCESS! LOCAL AI RECEPTIONIST IS LIVE AND RECORDING.');
    console.log('👉 Open your browser firmly to: http://localhost:8005/v2-demo.html');
    console.log('======================================================\\n');
    
  } catch (err) {
    console.error('Failed to securely proxy tunnel:', err);
  }
})();
