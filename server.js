const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Inisialisasi Socket.io dengan batas ukuran file 20MB
const io = new Server(server, {
    maxHttpBufferSize: 2e7 
});

// Mengatur folder 'public' sebagai tempat file statis (index.html, dll)
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('User terkoneksi:', socket.id);

    // 1. FITUR JOIN ROOM
    socket.on('join-room', (data) => {
        socket.join(data.room);
        socket.username = data.username;
        socket.room = data.room;
        
        // Kirim notifikasi sistem ke semua orang di room tersebut
        io.to(data.room).emit('chat-msg', { 
            user: 'Sistem', 
            text: `${data.username} bergabung ke dalam obrolan.` 
        });
    });

    // 2. FITUR INDIKATOR MENGETIK
    socket.on('typing', (data) => {
        socket.to(data.room).emit('user-typing', { 
            user: socket.username, 
            isTyping: data.isTyping 
        });
    });

    // 3. FITUR KIRIM CHAT TEKS
    socket.on('send-chat', (data) => {
        const msgId = "msg-" + Date.now() + Math.random().toString(36).substr(2, 9);
        io.to(data.room).emit('chat-msg', { 
            id: msgId, 
            user: socket.username, 
            text: data.message, 
            avatar: data.avatar 
        });
    });

    // 4. FITUR KIRIM GAMBAR
    socket.on('send-image', (data) => {
        const msgId = "msg-" + Date.now() + Math.random().toString(36).substr(2, 9);
        io.to(data.room).emit('receive-image', { 
            id: msgId, 
            user: socket.username, 
            image: data.image, 
            avatar: data.avatar 
        });
    });

    // 5. FITUR KIRIM VOICE NOTE
    socket.on('send-vn', (data) => {
        const msgId = "msg-" + Date.now() + Math.random().toString(36).substr(2, 9);
        io.to(data.room).emit('receive-vn', { 
            id: msgId, 
            user: socket.username, 
            audio: data.audio, 
            avatar: data.avatar 
        });
    });

    // 6. FITUR HAPUS PESAN SINKRON
    socket.on('delete-msg', (data) => {
        // Mengirim instruksi hapus ke semua client di room yang sama
        io.to(data.room).emit('remove-from-dom', data.messageId);
    });

    // 7. FITUR DISCONNECT
    socket.on('disconnect', () => {
        if (socket.username && socket.room) {
            io.to(socket.room).emit('chat-msg', { 
                user: 'Sistem', 
                text: `${socket.username} telah keluar.` 
            });
        }
    });
});

// PENTING: Gunakan process.env.PORT agar bisa berjalan di hosting (Render/Heroku)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`---------------------------------------`);
    console.log(`Server Chat Berhasil Dijalankan!`);
    console.log(`Akses Lokal: http://localhost:${PORT}`);
    console.log(`---------------------------------------`);
});