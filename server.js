// server.js - Wall Go WebSocket Relay (CommonJS)
const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });
const rooms = new Map();

wss.on('connection', (ws) => {
  let room = null, role = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'join') {
        room = msg.room;
        if (!rooms.has(room)) rooms.set(room, []);
        const list = rooms.get(room);
        role = msg.role === 'auto' ? (list.length === 0 ? 'blue' : 'red') : msg.role;
        list.push(ws);
        ws.send(JSON.stringify({ type: 'role', role }));
        broadcast(room, { type: 'system', text: `${role} joined` });
      } else if (msg.type === 'state') {
        broadcast(room, { type: 'state', state: msg.state }, ws);
      }
    } catch { /* ignore malformed */ }
  });

  ws.on('close', () => {
    if (!room) return;
    const list = rooms.get(room) || [];
    rooms.set(room, list.filter((c) => c !== ws));
    broadcast(room, { type: 'system', text: `${role} left` });
  });
});

function broadcast(room, msg, except) {
  const list = rooms.get(room) || [];
  for (const c of list) {
    if (c.readyState === 1 && c !== except) c.send(JSON.stringify(msg));
  }
}

console.log(`✅ Wall Go WebSocket Server running on port ${PORT}`);