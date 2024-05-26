// server/server.js
const express = require('express');
const bodyParser = require('body-parser');
const User = require('../models/user'); // Import the User model

// Create Express app
const app = express();

// Configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Specify root directory for serving static files
app.use(express.static(__dirname + '/../public'));

// Define routes

// GET route to serve the homepage
app.get('/', (req, res) => {
    res.sendFile('views/landing.html', { root: __dirname + '/../public' });
});

// Serve Sign up page
app.get('/signup', (req, res) => {
    res.sendFile('views/signup.html', { root: __dirname + '/../public' });
});

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile('views/login.html', { root: __dirname + '/../public' });
});


// // Register new user
// app.post('/register', async (req, res) => {
//     try {
//         const { username, password } = req.body;
//         const user = new User({ username, password });
//         await user.save();
//         res.status(201).send('User registered successfully');
//     } catch (error) {
//         res.status(500).send('Error registering user: ' + error.message);
//     }
// });

// // Login user
// app.post('/login', async (req, res) => {
//     try {
//         const { username, password } = req.body;
//         const user = await User.findOne({ username });
//         if (!user) {
//             return res.status(400).send('Invalid username or password');
//         }

//         const isMatch = await user.comparePassword(password);
//         if (!isMatch) {
//             return res.status(400).send('Invalid username or password');
//         }

//         res.send('Login successful');
//     } catch (error) {
//         res.status(500).send('Error logging in: ' + error.message);
//     }
// });

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
