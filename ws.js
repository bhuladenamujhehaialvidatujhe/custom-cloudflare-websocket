export default {
  async fetch(req, env, ctx) {
    const TARGET_HOST = 'ravi.ravikumar.live';
    const url = new URL(req.url);

    if (req.headers.get('upgrade')?.toLowerCase() === 'websocket') {
      try {
        const [client, server] = Object.values(new WebSocketPair());
        const targetUrl = `wss://${TARGET_HOST}${url.pathname}${url.search}`;

        const targetWs = new WebSocket(targetUrl, {
          headers: { 'Host': TARGET_HOST }
        });

        server.accept();

        targetWs.addEventListener('message', e => {
          if (server.readyState === 1) server.send(e.data);
        });

        server.addEventListener('message', e => {
          if (targetWs.readyState === 1) targetWs.send(e.data);
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
      } catch {
        return new Response('WebSocket failed', { status: 500 });
      }
    }

    try {
      const targetUrl = `https://${TARGET_HOST}${url.pathname}${url.search}`;

      const headers = new Headers(req.headers);
      ['host', 'connection', 'upgrade', 'keep-alive', 'proxy-connection',
       'cf-connecting-ip', 'cf-ipcountry', 'cf-ray'].forEach(h => headers.delete(h));

      headers.set('Host', TARGET_HOST);

      const res = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: req.body,
        redirect: 'manual'
      });

      const resHeaders = new Headers(res.headers);
      resHeaders.delete('content-encoding');
      resHeaders.delete('transfer-encoding');

      return new Response(res.body, {
        status: res.status,
        headers: resHeaders
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Proxy error', message: err.message || 'Unknown' }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};
