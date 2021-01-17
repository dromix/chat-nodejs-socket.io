const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('../src/util/message');
const { addUser, removeUser, getUser, getUsersInRoom } = require('../src/util/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server)

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('new socket connection ');

    socket.on('join', (options, cb) => {
        const {error, user} = addUser({id: socket.id, ...options})
        
        if (error) {
          return cb(error)
        }
        
        socket.join(user.room)

        socket.emit('message', generateMessage('Admin','Welcome'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })


        cb()
    })


    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter();
        const user = getUser(socket.id);

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }

        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    });

    socket.on('sendLocation', (coords, cb) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps/@${coords.lat},${coords.lon}z`))
        cb('Location shared');
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up on port: ${port}`);
})