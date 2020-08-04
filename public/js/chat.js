const socket = io()
//elements
const messageForm = document.querySelector('#message-form')
const messageFormInput = messageForm.querySelector('input')
const messageFormButton = messageForm.querySelector('button')
const messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username,room}=Qs.parse(location.search, {ignoreQueryPrefix:true})

const autoScroll =() =>{
  //new message element
  const newMessage = messages.lastElementChild
  // height of the new message
  const newMessageStyles = getComputedStyle(newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin
  // console.log(newMessageMargin)
  //visible height
  const visibleHeight = messages.offsetHeight
  //height of message Container
  const containerHeight = messages.scrollHeight
  //how far have i scrolled?
  const scrollOffset = messages.scrollTop + visibleHeight
  if(containerHeight - newMessageHeight <= scrollOffset){
    messages.scrollTop = messages.scrollHeight
  }

}

socket.on('message',(message)=>{
  console.log(message)
  const html = Mustache.render(messageTemplate,{
    username:message.username,
    msg:message.text,
    createdAt:moment(message.createdAt).format('h:mm a')
  })
    messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})
socket.on('locationMessage',(message)=>{
  console.log(message)
  const html = Mustache.render(locationMessageTemplate,{
    username:message.username,
    url:message.url,
    createdAt:moment(message.createdAt).format('h:mm a')
  })
  messages.insertAdjacentHTML('beforeend',html)
  autoScroll()

})
socket.on('roomData',({room,users}) =>{
  const html = Mustache.render(sidebarTemplate,{
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

messageForm.addEventListener('submit',(e)=>{
  e.preventDefault()
  messageFormButton.setAttribute('disabled','disabled')
  const message = document.querySelector('input').value

  messageFormButton.removeAttribute('disabled')
  messageFormInput.value =''
  messageFormInput.focus()
  socket.emit('sendMessage',message,(error)=>{
    if(error){
      return console.log(error)
    }
    console.log('the mesage was delivered')
  })
})

document.querySelector('#send-location').addEventListener('click',()=>{
  if(!navigator.geolocation){
    return alert('geolocation is not supported by your brower')
  }
  navigator.geolocation.getCurrentPosition((position)=>{
    // console.log(position)
    socket.emit('send-location',{
      latitude:position.coords.latitude,
      longitude:position.coords.longitude
    },()=>{
      console.log('location shared')
    })
  })
})


socket.emit('join',{username,room},(error)=>{
  if(error){
    alert(error)
    location.href='/'
  }
})