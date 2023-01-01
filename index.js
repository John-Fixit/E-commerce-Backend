const express = require('express');
const app = express();
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')
require('dotenv').config()
const PORT = process.env.PORT
const URL = process.env.URL
const userRouter = require('./Routes/user.route')
const adminRouter = require('./Routes/admin.route')
const cors = require('cors')
const bodyParser = require('body-parser');
const { json } = require('express');
app.use(bodyParser.urlencoded({extended:true, limit: '100mb'}))
app.use(json({limit: '100mb'}))
app.use(cors())
mongoose.connect(URL, (err)=>{
    if(err){
        console.log(`mongoDB not connected`);
    }
    else{
        console.log(`MongoDB connected`);
    }
})
app.use('/user', userRouter)
app.use('/admin', adminRouter)
app.listen(PORT, ()=>{
    console.log(`Server is listen on port ${PORT}`);
})