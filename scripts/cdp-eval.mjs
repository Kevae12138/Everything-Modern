const expression = process.argv.slice(2).join(" ");
const tabs = await fetch("http://127.0.0.1:9223/json/list").then((response) => response.json());
const tab = tabs.find((item) => item.type === "page") ?? tabs[0];
const socket = new WebSocket(tab.webSocketDebuggerUrl);

socket.addEventListener("open", () => {
  socket.send(
    JSON.stringify({
      id: 1,
      method: "Runtime.evaluate",
      params: {
        expression,
        awaitPromise: true,
        returnByValue: true
      }
    })
  );
});

socket.addEventListener("message", (event) => {
  console.log(event.data);
  socket.close();
});
