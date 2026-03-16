// 'use strict';

// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const os = require('os');
// const path = require('path');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// const PORT = process.env.PORT || 8080;

// app.use(express.static(path.join(__dirname)));

// io.on('connection', (socket) => {

//   // convenience function to log server messages on the client
//   function log() {
//     const array = ['Message from server:'];
//     array.push.apply(array, arguments);
//     socket.emit('log', array);
//   }

//   socket.on('message', (message, room) => {
//     log('Client said: ', message);
//     if (room) {
//       socket.to(room).emit('message', message);
//     } else {
//       socket.broadcast.emit('message', message);
//     }
//   });

//   socket.on('create or join', async (room) => {
//     log('Received request to create or join room ' + room);

//     const sockets = await io.in(room).fetchSockets();
//     const numClients = sockets.length;
//     log('Room ' + room + ' now has ' + numClients + ' client(s)');

//     if (numClients === 0) {
//       socket.join(room);
//       log('Client ID ' + socket.id + ' created room ' + room);
//       socket.emit('created', room, socket.id);

//     } else if (numClients === 1) {
//       log('Client ID ' + socket.id + ' joined room ' + room);
//       io.to(room).emit('join', room);
//       socket.join(room);
//       socket.emit('joined', room, socket.id);
//       io.to(room).emit('ready');
//     } else { // max two clients
//       socket.emit('full', room);
//     }
//   });

//   socket.on('ipaddr', () => {
//     const ifaces = os.networkInterfaces();
//     for (const dev in ifaces) {
//       ifaces[dev].forEach((details) => {
//         if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
//           socket.emit('ipaddr', details.address);
//         }
//       });
//     }
//   });

//   socket.on('bye', () => {
//     console.log('received bye');
//   });

// });

// server.listen(PORT, () => {
//   console.log(`Server listening on http://localhost:${PORT}`);
// });
'use strict';

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname)));

// roomName -> senderSocketId
const roomSenders = new Map();

// socketId -> { room, role }
const socketMeta = new Map();

io.on('connection', (socket) => {
  function log(...args) {
    socket.emit('log', ['Message from server:', ...args]);
  }

  socket.on('join room', async ({ room, role }) => {
    if (!room || !role) return;

    socket.join(room);
    socketMeta.set(socket.id, { room, role });

    log(`Socket ${socket.id} joined room ${room} as ${role}`);

    if (role === 'sender') {
      roomSenders.set(room, socket.id);
      socket.emit('role assigned', {
        role: 'sender',
        room,
        socketId: socket.id
      });

      // tell existing viewers who the sender is
      const sockets = await io.in(room).fetchSockets();
      for (const s of sockets) {
        if (s.id !== socket.id) {
          const meta = socketMeta.get(s.id);
          if (meta?.role === 'viewer') {
            io.to(s.id).emit('sender available', {
              room,
              senderId: socket.id
            });
          }
        }
      }
    } else {
      const senderId = roomSenders.get(room) || null;

      socket.emit('role assigned', {
        role: 'viewer',
        room,
        socketId: socket.id,
        senderId
      });

      if (senderId) {
        io.to(senderId).emit('viewer joined', {
          room,
          viewerId: socket.id
        });

        socket.emit('sender available', {
          room,
          senderId
        });
      } else {
        socket.emit('waiting for sender', { room });
      }
    }
  });

  socket.on('signal', ({ room, target, data }) => {
    if (!target || !data) return;

    const meta = socketMeta.get(socket.id);
    io.to(target).emit('signal', {
      room: room || meta?.room || null,
      from: socket.id,
      data
    });
  });

  socket.on('disconnect', () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    const { room, role } = meta;

    if (role === 'sender') {
      roomSenders.delete(room);

      socket.to(room).emit('sender disconnected', {
        room,
        senderId: socket.id
      });
    } else {
      const senderId = roomSenders.get(room);
      if (senderId) {
        io.to(senderId).emit('viewer disconnected', {
          room,
          viewerId: socket.id
        });
      }
    }

    socketMeta.delete(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});