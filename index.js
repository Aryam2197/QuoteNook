require('dotenv').config();
const express = require('express');
const app = express();
const User = require('./models/user');
const connectDB = require('./server/db');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('connect-flash');
const axios = require('axios');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Connect to the database
connectDB();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'notagoodsecret',
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

const requireLogin = (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('login');
    }
    next();
}

app.get('/', requireLogin, async (req, res) => {
    const user = await User.findById(req.session.user_id);
    res.render('home', { username: user.username, email: user.email });
})

app.get('/register', (req, res) => {
    const messages = req.flash('failed');
    res.render('signup', { messages: messages });
})

app.get('/login', (req, res) => {
    const messages = req.flash('failed_login');
    res.render('login', { messages: messages });
})

app.get('/home2', requireLogin, (req, res) => {
    res.send("home2");
})

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const checkUser = await User.findOne({ username });
    if (checkUser) {
        req.flash('failed', 'Username Already Exists');
        return res.render('signup', { messages: req.flash('failed') });
    }

    const checkEmail = await User.findOne({ email });
    if (checkEmail) {
        req.flash('failed', 'Email Already Exists');
        return res.render('signup', { messages: req.flash('failed') });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = new User({
        username: username,
        email: email,
        password: hash
    });

    await user.save();
    req.session.user_id = user._id;
    res.redirect('login');
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
        req.flash('failed_login', 'Username or Password Incorrect');
        return res.render('login', { messages: req.flash('failed_login') });
    }
    const result = await bcrypt.compare(password, user.password);

    if (result) {
        req.session.user_id = user._id;
        res.redirect('/');
    } else {
        req.flash('failed_login', 'Username or Password Incorrect');
        res.render('login', { messages: req.flash('failed_login') });
    }
})

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('login');
})

app.post('/send-quote', requireLogin, async (req, res) => {
    const { tag } = req.body;
    const user = await User.findById(req.session.user_id);

    try {
        // Get a quote from LukePeavy API
        const response = await axios.get(`https://api.quotable.io/quotes?tags=${tag}`);
        const data = response.data;
        const randomQuote = data.results[Math.floor(Math.random() * data.results.length)];
        console.log(randomQuote.content);
        console.log(`- ${randomQuote.author}`);
        
         
        // Read the email template file
        const emailTemplatePath = path.join(__dirname, 'templates', 'email1.html');
        const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf8');
        
        // Replace placeholders in the template with actual data
        const formattedEmail = emailTemplate
            .replace('<%= username %>', user.username)
            .replace('<%= randomQuote %>', `"${randomQuote.content}" - ${randomQuote.author}`);

        // Send email with the quote
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your Quote of the Day',
            text: randomQuote,
            html: formattedEmail
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                req.flash('failed', 'Failed to send email');
                res.status(500).json({ success: false, message: 'Failed to send email' });
            } else {
                console.log('Email sent: ' + info.response);
                req.flash('success', 'Quote sent to your email');
                res.status(200).json({ success: true, message: 'Quote sent to your email' });
            }
        });
    } catch (error) {
        console.log(error);
        req.flash('failed', 'Failed to get quote or send email');
        res.status(500).json({ success: false, message: 'Failed to get quote or send email' });
    }
});

app.listen(3000, () => {
    console.log('Server running at 3000');
});
