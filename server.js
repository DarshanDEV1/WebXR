const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
let meetingCodes = {};

app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('createMeeting', (code) => {
        meetingCodes[code] = socket.id;
        socket.join(code);
        console.log(`Meeting created with code: ${code}`);
    });

    socket.on('joinMeeting', (code) => {
        const hostSocketId = meetingCodes[code];
        if (hostSocketId) {
            socket.join(code);
            socket.to(hostSocketId).emit('viewerJoined', socket.id);
            socket.emit('joinMeetingSuccess', code);
            console.log(`User joined meeting with code: ${code}`);
        } else {
            socket.emit('invalidCode');
        }
    });

    socket.on('offer', (data) => {
        io.to(data.target).emit('offer', data);
    });

    socket.on('answer', (data) => {
        io.to(data.target).emit('answer', data);
    });

    socket.on('candidate', (data) => {
        io.to(data.target).emit('candidate', data);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        for (const code in meetingCodes) {
            if (meetingCodes[code] === socket.id) {
                delete meetingCodes[code];
                socket.to(code).emit('hostDisconnected');
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
