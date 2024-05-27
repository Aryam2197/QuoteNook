const express = require('express');
const app = express();
const User = require('./models/user');
const db = require('./server/db')
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('connect-flash');


app.set('view engine', 'ejs');
app.set('views','views');

app.use(express.static('public'));

app.use(express.urlencoded({extended:true}));

app.use(session({
    secret : 'notagoodsecret',
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

const requireLogin = (req,res,next)=>{
    if(!req.session.user_id){
        return res.redirect('login');
    }
    next();
}

app.get('/', requireLogin, (req,res)=>{
    res.render('home');
})

app.get('/register',(req,res)=>{
    const messages = req.flash('failed');
    res.render('signup',{messages:messages});
})

app.get('/login',(req,res)=>{
    const messages = req.flash('failed_login');
    res.render('login',{messages:messages});
})

app.get('/home2',requireLogin,(req,res)=>{
    res.send("home2");
})

app.post('/register', async (req,res) =>{
    const {username,password} = req.body;
    const checkuser = await User.findOne({username});
    if(checkuser){
        req.flash('failed','Username Already Exists');
        return res.render('signup',{messages : req.flash('failed')});
    }

    const hash = await bcrypt.hash(password,12);
    const user = new User({
        username:username,
        password:hash
    })
    

    await user.save();
    req.session.user_id=user._id; 
    res.redirect('login')
})

app.post('/login', async (req,res) =>{
    const {username,password} = req.body;
    const user = await User.findOne({username});
    if(!user){
        req.flash('failed_login','Username or Password Incorrect');
        res.render('login',{messages : req.flash('failed_login')});
    }
    const result = await bcrypt.compare(password, user.password);

    if(result){
        req.session.user_id=user._id; 
        res.redirect('/')

    }
    else{
        req.flash('failed_login','Username or Password Incorrect');
        res.render('login',{messages : req.flash('failed_login')});
    }
    // res.redirect('/')
})


app.post('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('login');
})

app.listen(3000,()=>{
    console.log('Server running at 3000');
})