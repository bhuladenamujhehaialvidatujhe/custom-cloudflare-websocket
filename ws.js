export default {
  async fetch(request) {
    const TARGET_HOST = 'ravi.ravikumar.live';
    const url = new URL(request.url);

    if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
      try {
        const [client, server] = Object.values(new WebSocketPair());
        const targetUrl = `wss://${TARGET_HOST}${url.pathname}${url.search}`;

        const targetWs = new WebSocket(targetUrl, {
          headers: { 'Host': TARGET_HOST }
        });

        server.accept();

        targetWs.addEventListener('message', event => {
          if (server.readyState === 1) server.send(event.data);
        });

        server.addEventListener('message', event => {
          if (targetWs.readyState === 1) targetWs.send(event.data);
        });

        const closeBoth = () => {
          try { targetWs.close(); } catch {}
          try { server.close(); } catch {}
        };

        targetWs.addEventListener('close', closeBoth);
        targetWs.addEventListener('error', closeBoth);
        server.addEventListener('close', closeBoth);
        server.addEventListener('error', closeBoth);

        return new Response(null, {
          status: 101,
          webSocket: client
        });
      } catch (err) {
        return new Response('WebSocket proxy failed', { status: 500 });
      }
    }

    try {
      const targetUrl = `https://${TARGET_HOST}${url.pathname}${url.search}`;

      const headers = new Headers(request.headers);
      ['host', 'connection', 'upgrade', 'keep-alive', 'proxy-connection', 'cf-connecting-ip', 'cf-ray']
        .forEach(key => headers.delete(key));

      headers.set('Host', TARGET_HOST);

      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: request.body,
        redirect: 'manual'
      });

      const newHeaders = new Headers(response.headers);
      newHeaders.delete('content-encoding');
      newHeaders.delete('transfer-encoding');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Proxy Error', message: err.message }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};
