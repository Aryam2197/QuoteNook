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

// app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));


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

app.get('/home', requireLogin, async (req, res) => {
    const user = await User.findById(req.session.user_id);
    res.render('home', { username: user.username, email: user.email });
})



app.get('/', (req, res) => {
    res.render('landing');
})

app.get('/verify', (req, res) => {
    const messages = req.flash('userFailed');
    res.render('forgotPASS_verify_user', { messages: messages });
})

app.get('/verify-otp', (req, res) => {
    res.render('verify_otp', ); // Pass the message to the view
});

app.get('/reset-password', (req, res) => {
    const userId = req.query.userId;
    res.render('reset_password',{userId:userId}); 
});

app.get('/register', (req, res) => {
    const messages = req.flash('failed');
    res.render('signup', { messages: messages });
})

app.get('/login', (req, res) => {
    const messages = req.flash('failed_login');
    res.render('login', { messages: messages });
})

// app.get('/home2', requireLogin, (req, res) => {
//     res.send("home2");
// })

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
        res.redirect('/home');
    } else {
        req.flash('failed_login', 'Username or Password Incorrect');
        res.render('login', { messages: req.flash('failed_login') });
    }
})


app.post('/verify', async (req, res) => {
    const { username } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
        req.flash('userFailed', 'Username Not Found');
        return res.render('forgotPASS_verify_user', { messages: req.flash('userFailed') });
    }

    const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    // Store OTP and its expiration in the user document
    user.otp = otp;
    user.otpExpiration = otpExpiration;
    await user.save();

    // Read the OTP email template file
    const emailTemplatePath = path.join(__dirname, 'templates', 'otp_email.html');
    const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf8');

    // Replace placeholders in the template with actual data
    const formattedEmail = emailTemplate
        .replace('<%= username %>', user.username)
        .replace('<%= otp %>', otp);

    // Send OTP via email
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset OTP',
        html: formattedEmail
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).send('Error sending OTP');
        }
        console.log('Email sent: ' + info.response);
        res.render('verify_otp');
    });
});



// const requireLogin1 = (req, res, next) => {
//     if (!req.session.user_id) {
//         return res.redirect('login');
//     }
//     next();
// }

app.post('/verify-otp', async (req, res) => {
    // const user1 = await User.findById(req.session.user_id);
    const { otp } = req.body;
    const user = await User.findOne({ otp }); // Find the user by OTP

    if (!user || new Date() > user.otpExpiration) {
        req.flash('failed', 'Invalid OTP or OTP expired');
        return res.redirect('/verify-otp'); // Redirect back to the OTP verification page with an error message
    }

    // const userEmail = user.email;
    // const maskedEmail = `${userEmail.substring(0, 3)}***${userEmail.substring(userEmail.length - 2)}`; // Mask the email address
    // req.flash('OTPsend', `Check ${maskedEmail}`); // Set the flash message with masked email
    res.redirect(`/reset-password?userId=${user._id}`); // Render a page with a form to reset password
});



app.post('/reset-password', async (req, res) => {
    const { userId, newPassword } = req.body;

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
        req.flash('failed', 'User not found');
        return res.redirect('/verify-otp'); // Redirect to OTP verification page with an error message
    }

    // Update the user's password and remove OTP fields
    user.password = await bcrypt.hash(newPassword, 12);
    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save();

    req.flash('success', 'Password successfully changed');
    res.redirect('/login'); // Redirect to login page with success message
});



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
