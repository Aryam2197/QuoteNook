const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/QouteNook')
    .then(()=>{
        console.log("CONNECTED!")
    })
    .catch(err =>{
        console.log("CONNECTION FAILED!!")
    });

    const productSchema = new mongoose.Schema({
        name : {
                type:String,
                required:true
            },
        price : {
                type : Number,
                min : [0,'Price must be possitive']
        },
        onSale : {
                type : Boolean,
                default : false
        }
});
