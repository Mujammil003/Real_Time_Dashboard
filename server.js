const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { MongoClient } = require('mongodb');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(__dirname + '/public'));

const graphTypes = ['scatter', 'line', 'bar', 'horizontal', 'vertical'];
let suggestedGraphType = 'scatter'; // Default suggested graph type

// Function to suggest the best graph type based on the new data
function suggestBestGraph(newData) {
    if (newData > 50) {
        return 'line';
    } else {
        return 'bar';
    }
}

// MongoDB connection
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
}

async function fetchDataFromDatabase() {
    const db = client.db('real_time_db'); // Replace 'real_time_db' with your database name
    const collection = db.collection('data'); // Replace 'data' with your collection name

    try {
        const data = await collection.find({}).toArray();
        return data;
    } catch (error) {
        console.error('Error fetching data from the database:', error);
        return [];
    }
}

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log('A user connected');

    // Emit initial suggested graph types to the client
    socket.emit('graphTypesChange', graphTypes);

    // Fetch data from the database and emit to clients
    fetchDataFromDatabase().then((data) => {
        socket.emit('initialData', data);
    });

    // Simulate data generation and emit to clients
    setInterval(() => {
        const randomData = Math.floor(Math.random() * 100);
        const suggestedGraphType = suggestBestGraph(randomData);

        io.emit('updateData', { newData: randomData, suggestedGraphType });
    }, 2000);

    // Listen for graph type changes from the client
    socket.on('changeGraphType', (newGraphType) => {
        console.log(`Suggested graph type changed to: ${newGraphType}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server and connect to the database
const PORT = process.env.PORT || 3000;
connectToDatabase().then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
