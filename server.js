// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');

// const app = express();

// app.use(cors());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));

// let clients = [];
// let facts = [];

// function eventsHandler(request, response, next) {
//   const headers = {
//     'Content-Type': 'text/event-stream',
//     'Connection': 'keep-alive',
//     'Cache-Control': 'no-cache'
//   };
//   response.writeHead(200, headers);

//   const clientId = Date.now();

//   const newClient = {
//     id: clientId,
//     response
//   };

//   clients.push(newClient);

//   request.on('close', () => {
//     console.log(`${clientId} Connection closed`);
//     clients = clients.filter(client => client.id !== clientId);
//   });
// }

// function sendEventsToAll(newFact) {
//   clients.forEach(client => {
//     client.response.write(`data: ${JSON.stringify(newFact)}\n\n`);
//   });
// }

// async function addFact(request, response, next) {
//   const newFact = request.body;
//   facts.push(newFact);
//   response.json(newFact);
//   sendEventsToAll(newFact);
// }

// app.post('/fact', addFact);

// app.get('/events', eventsHandler);

// app.get('/status', (request, response) => response.json({ clients: clients.length }));

// const PORT = 3001;

// app.listen(PORT, () => {
//   console.log(`Facts Events service listening at http://localhost:${PORT}`);
// });
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { EventEmitter } = require('events'); // Import EventEmitter

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store messages in memory (replace with database for production)
let messages = [];

// Create an EventEmitter instance
const eventEmitter = new EventEmitter();

// SSE endpoint for real-time message updates
app.get('/events', (req, res) => {
  console.log('Client connected')
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send existing messages to new clients upon connection
  messages.forEach(sendEvent);

  const messageListener = (data) => sendEvent(data); // Listener function for 'message' event

  // Add the listener to the EventEmitter
  eventEmitter.addListener('message', messageListener);

  req.on('close', () => {
    // Remove the listener when the client disconnects
    eventEmitter.removeListener('message', messageListener);
    console.log('Client disconnected');
  });
});

// Endpoint to send messages
app.post('/send-message', (req, res) => {
  const { username, message } = req.body;
  const newMessage = { username, message };
  messages.push(newMessage);
  
  // Emit the 'message' event to all connected clients
  eventEmitter.emit('message', newMessage);

  res.status(200).json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


