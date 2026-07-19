import { writeFileSync } from "node:fs";

const output = process.argv[2];
if (!output) throw new Error("Missing screenshot output path.");

const tabs = await fetch("http://127.0.0.1:9223/json/list").then((response) => response.json());
const tab = tabs.find((item) => item.type === "page") ?? tabs[0];
const socket = new WebSocket(tab.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();

function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const task = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) task.reject(new Error(JSON.stringify(message.error)));
  else task.resolve(message.result);
});

socket.addEventListener("open", async () => {
  try {
    await call("Page.bringToFront");
    const result = await call("Page.captureScreenshot", { format: "png", fromSurface: true });
    writeFileSync(output, Buffer.from(result.data, "base64"));
  } finally {
    socket.close();
  }
});
