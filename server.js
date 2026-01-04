const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    maxHttpBufferSize: 1e8 // Kapasitas besar untuk kirim gambar
});

app.use(express.static(path.join(__dirname, 'public')));

// Menyimpan daftar user per room agar fitur Online lancar
const usersInRooms = {};

io.on('connection', (socket) => {
    socket.on('join-room', (data) => {
        socket.join(data.room);
        socket.username = data.username;
        socket.room = data.room;

        if (!usersInRooms[data.room]) usersInRooms[data.room] = [];
        if (!usersInRooms[data.room].includes(data.username)) {
            usersInRooms[data.room].push(data.username);
        }

        // Notifikasi pink bergabung & Update daftar online
        io.to(data.room).emit('user-joined', { username: data.username });
        io.to(data.room).emit('update-online', usersInRooms[data.room]);
    });

    socket.on('send-chat', (data) => {
        io.to(data.room).emit('chat-msg', data);
    });

    socket.on('send-image', (data) => {
        io.to(data.room).emit('receive-image', data);
    });

    // Fitur Hapus Pesan
    socket.on('delete-msg', (data) => {
        io.to(data.room).emit('msg-deleted', data.id);
    });

    socket.on('disconnect', () => {
        if (socket.room && usersInRooms[socket.room]) {
            usersInRooms[socket.room] = usersInRooms[socket.room].filter(u => u !== socket.username);
            io.to(socket.room).emit('update-online', usersInRooms[socket.room]);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => { 
    console.log(`Server aktif! Silakan buka http://localhost:${PORT}`); 
});