const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage,generateLocationMessage} = require('./utils/messages')
const {addUser,removeUser,getUser,getUserInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDiPath = path.join(__dirname,'../public')
app.use(express.static(publicDiPath))

io.on('connection',(socket)=>{
  console.log('new webSocket connection')
  
  socket.on('join',(options,callback)=>{
    const {error,user} = addUser({id:socket.id, ...options})
    if(error){
      return callback(error)
    }
    socket.join(user.room)

    socket.emit('message',generateMessage('Admin','Welcome'))

    socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has Joined`))
    io.to(user.room).emit('roomData',{
      room:user.room,
      users:getUserInRoom(user.room)
    })
    callback()
  })


  socket.on('sendMessage',(msg,callback)=>{
    const user = getUser(socket.id)
    const filter = new Filter()
    if(filter.isProfane(msg)){
       return callback('propanity is not allowed')
    }
    io.to(user.room).emit('message',generateMessage(user.username,msg))
    callback()
  })
  socket.on('send-location',(coords,callback)=>{
    const user = getUser(socket.id)
    io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
    callback()
  })
  socket.on('disconnect',()=>{
    const user = removeUser(socket.id)
    if(user){
      io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left`))
      io.to(user.room).emit('roomData',{
        room:user.room,
        users:getUserInRoom(user.room)
      })
    }
  })
})

server.listen(port,()=>{
  console.log(`server is upon port ${port}`)
})