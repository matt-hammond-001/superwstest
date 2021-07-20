import http from 'http';
import WebSocket from 'ws';

export default () => {
  const server = http.createServer();
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    ws.on('message', (message) => {
      if (typeof message !== 'string') {
        ws.send(Buffer.concat([
          new Uint8Array([111]),
          new Uint8Array(message),
        ]));
        return;
      }
      if (message === 'trigger-server-close') {
        ws.close(4321, 'Oops');
        return;
      }
      const match = message.match(/^wait ([0-9]+) (.+)$/);
      if (match) {
        const delayMs = Number(match[1]);
        const reply = match[2];
        setTimeout(
          () => { ws.send(reply); },
          delayMs,
        );
        return;
      }
      if (message.startsWith('{')) {
        ws.send(message);
      } else {
        ws.send(`echo ${message}`);
      }
    });

    if (ws.protocol === 'show-foo-header') {
      ws.send(`show-foo-header protocol: ${req.headers.foo}`);
    } else {
      ws.send('hello');
    }
  });

  return server;
};
