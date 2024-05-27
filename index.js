const express = require('express');
const app = express();
const User = require('./models/user');
const db = require('./server/db')
const bcrypt = require('bcrypt');


app.set('view engine', 'ejs');
app.set('views','views');

app.use(express.static('public'));

app.use(express.urlencoded({extended:true}));


app.get('/secrets',(req,res)=>{
    res.send("You cannot se mee");
})

app.get('/register',(req,res)=>{
    res.render('signup');
})
app.get('/',(req,res)=>{
    res.render('home');
})

app.post('/register', async (req,res) =>{
    const {username,password} = req.body;
    const hash = await bcrypt.hash(password,12);
    const user = new User({
        usename:username,
        password:hash
    })
    await user.save();
    res.redirect('/',)
})

app.listen(3000,()=>{
    console.log('Server running at 3000');
})