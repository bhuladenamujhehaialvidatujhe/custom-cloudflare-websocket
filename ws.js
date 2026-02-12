export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      // नया UUID यहाँ डाल दिया है
      const UUID = "acac15ea-290c-490b-9665-3e2165356904";

      const targetHost = "ravi.ravikumar.live";
      const wsPath = "/vless";

      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      server.accept();

      const remoteWs = new WebSocket(`wss://${targetHost}${wsPath}`, {
        headers: {
          "Host": targetHost,
          "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0",
          "Origin": `https://${targetHost}`
        }
      });

      server.addEventListener("message", event => {
        if (remoteWs.readyState === WebSocket.OPEN) {
          remoteWs.send(event.data);
        }
      });

      remoteWs.addEventListener("message", event => {
        if (server.readyState === WebSocket.OPEN) {
          server.send(event.data);
        }
      });

      const closeBoth = () => {
        try { remoteWs.close(); } catch {}
        try { server.close(); } catch {}
      };

      remoteWs.addEventListener("close", closeBoth);
      remoteWs.addEventListener("error", closeBoth);
      server.addEventListener("close", closeBoth);
      server.addEventListener("error", closeBoth);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response(
      `VLESS + WS (path: /vless) is running on ${url.hostname}\n\n` +
      `Client config example:\n` +
      `vless://${UUID}@${url.hostname}:443?encryption=none&security=tls&type=ws&host=${url.hostname}&path=/vless&sni=${url.hostname}#Ravi-VLESS-WS`,
      { status: 200 }
    );
  }
};
