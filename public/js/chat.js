const socket = io()

// Elements

const chatForm = document.querySelector('#message-form'),
      chatInput = chatForm.querySelector('input'),
      chatButton = chatForm.querySelector('button');

const messages = document.querySelector('#messages');
const locationButton = document.querySelector('#location');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const linkMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true});

const autoscroll = () => {
    // New message element
    const newMessage = messages.lastElementChild
    const scrolledToTheBottomZone = 10
    // Height of the new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = messages.offsetHeight

    // Height of messages container
    const containerHeight = messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset + scrolledToTheBottomZone) {
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username, 
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:MM a')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(linkMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('hh:MM a')
    });
    
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room, users
    });
    
    document.querySelector('#sidebar').innerHTML = html;
})

chatForm.addEventListener('submit', (e) => {
    e.preventDefault()

    chatButton.setAttribute('disabled', 'disabled');

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        chatButton.removeAttribute('disabled');

        chatInput.value = '';
        chatInput.focus();

        if (error) {
            return console.log(error);
        }

        console.log('Message delivered');
    })
})

locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('geolocation is not supported by your browser')
    }

    locationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', 
        {
            lat: position.coords.latitude,
            lon: position.coords.longitude
        }, (res) => {
            locationButton.removeAttribute('disabled');
        });
    });
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/'
    }
})