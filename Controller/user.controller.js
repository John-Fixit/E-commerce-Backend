
const { userModel } = require("../Model/user.model")
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary')
const { productModel } = require("../Model/admin.model")
const SECRET = process.env.JWT_SECRET
const EMAIL = process.env.EMAIL
const PASSWORD = process.env.PASSWORD
const CLOUD_NAME = process.env.CLOUD_NAME
const API_KEY = process.env.API_KEY
const API_SECRET = process.env.API_SECRET
const getLandingPage = (req, res) => {
    res.send(`Welcome to e-commerce site`)
}
cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET
});
var transporter = nodemailer.createTransport({
    service: 'smtp@gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: EMAIL,
        pass: PASSWORD
    }
});
const signup = (req, res) => {
    const userDetails = req.body
    const userEmail = userDetails.email
    const userFullName = userDetails.firstname + ' ' + userDetails.lastname
    userModel.findOne({ email: userDetails.email }, (err, user) => {
        if (err) {
            res.send({message: `There's an error, please check your connection`, status: false})
        } else {
            if (user) {
                res.send({ message: `user already exist, with the email entered`, status: false })
            }
            else {
                const form = new userModel(userDetails)
                form.save((err) => {
                    if (err) {
                        res.status(501).send({ message: `Registration error, please check your connection`, status: false })
                    } else {
                        var mailMessage = {
                            from: EMAIL,
                            to: userEmail,
                            subject: 'Registration Confirmation',
                            html: `<b class='card-title'>Dear ${userFullName},</b>
                            <p >Welcome to JFIX e-commerce site!</p>
                            <p >Congratulations! your e-commerce account has been successfully created.</p>
                            <p >With JFIX e-commerce site, you can now enjoy peace mind of shopping without cash involved. it's a simple, fast and secure.</p>
                            <p>click on this <a href='https://google.com'>link</a> to sign in to your account
                            Thank you!`
                        }
                        transporter.sendMail(mailMessage, (err, info) => {
                            if (err) {
                                res.send({message: `Connection error!`, status: false})
                            }
                            else {
                                res.status(200).send({ message: `Registration successfull !!!`, status: true, })
                            }
                        })
                    }
                })
            }
        }
    })
}
const signin = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    userModel.findOne({ email: email }, (err, user) => {
        if (err) {
            console.log(`internal error`);
            res.send({message: `Internal server error, check your connection!`, status: false})
        }
        else {
            if (!user) {
                res.send({ message: `No account of this details is with us, Please signup`, status: false })
            }
            else {
                user.validatePassword(password, (err, same) => {
                    if (err) {
                        console.log(`issue occur`);
                        res.send({message: `Connection Error! please check your connection`, status: false})
                    }
                    else {
                        if (same) {
                            const token = jwt.sign({ email }, SECRET, { expiresIn: '2h' })
                            res.send({ message: 'authenticated successfull', status: true, token })
                        }
                        else {
                            res.send({ message: 'incorrect password', status: false })
                        }
                    }
                })
            }
        }
    })
}
const home = (req, res) => {
    const token = req.headers.authorization.split(' ')[1]
    jwt.verify(token, SECRET, (err, result) => {
        if (err) {
            res.send({ message: `user is unathorized`, status: false })
        } else {
            userModel.findOne({ email: result.email }, (err, userDetails) => {
                if (err) {
                    res.send({ message: `Network error, please check your connection`, status: false })
                }
                else {
                    res.send({ message: `user authorized`, status: true, userDetails })
                }
            })
        }
    })
}
const getUser = (req, res) => {
    const userId = req.body.userId
    userModel.findOne({ '_id': userId }, (err, user) => {
        if (err) {
            res.send({ message: `User unidentified`, status: false })
        } else {
            res.send({ user, status: true })
        }
    })
}
const getCart = (req, res) => {
    const userId = req.body.userId
    userModel.findOne({ "_id": userId }, (err, user) => {
        if (err) {
            res.send({ message: `internal server error`, status: false })
        } else {
            let totalPrice = 0;
            user.cartProduct.map((eachProduct) => {
                totalPrice += parseInt(eachProduct.productPrice)
            })
            res.send({ message: `Cart products`, user, products: user.cartProduct, status: true, totalPrice })
        }
    })
}
const cartProduct = (req, res) => {
    const productImage = req.body.productImage
    const productTitle = req.body.title
    const productVariation = req.body.productVariation
    const productPrice = req.body.price * productVariation
    const userId = req.body.userId
    userModel.findOneAndUpdate({ '_id': userId }, { $push: { 'cartProduct': { productImage, productPrice, productTitle, productVariation } } }, (err, updatedVersion) => {
        if (err) {
            res.send({ message: `Internal server error`, status: false })
        }
        else {
            res.send({ message: `Product added to your cart`, status: true })
        }
    })
}
const removeCartItem = (req, res) => {
    const userId = req.body.userId;
    const productImage = req.body.productImage
    userModel.findOne({ '_id': userId }, (err, result) => {
        if (err) {
            res.send({message: `Internal server error, please check your connection`, status: false})
        } else {
            const thisUser = result
            let found = thisUser.cartProduct.filter(thisOne =>
                productImage != thisOne.productImage
            )
            if (found) {
                userModel.findOneAndUpdate({ '_id': userId }, { 'cartProduct': found }, (err, productRemains) => {
                    if (err) {
                        res.send({message: `An error occur in the updating of the remaining product`, status: false})
                    } else {
                        res.send({message: `Deleted successfully`, status: true})
                    }
                })
            }
        }
    })
}
const saveProfile = (req, res) => {
    const userId = req.body.userId
    const userEmail = req.body.email
    const firstname = req.body.firstname
    const lastname = req.body.lastname
    const contact = req.body.contact
    const gender = req.body.gender
            userModel.findOneAndUpdate({ '_id': userId }, { $set: {'firstname': firstname, 'lastname': lastname, 'email': userEmail, 'contact': contact, 'gender': gender } }, (err, result) => {
                if (err) {
                    res.send({message: `Internal server error, please check your connection`, status: false})
                } else {
                    res.send({message: `updated succesfully`, status: true})
                }
            })
}
const saveProfilePhoto=(req, res)=>{
    const profilePhoto = req.body.profilePhoto
    const userId = req.body.userId
    cloudinary.v2.uploader.upload(profilePhoto, (err, result) => {
        if (err) {
            res.send({message: `Unable to upload, due to internalserver error, please try again`})
        } else {
            const uploadedPhoto = result.secure_url
            userModel.findOneAndUpdate({ '_id': userId }, {'profilePhoto': uploadedPhoto }, (err, result) => {
                if (err) {
                    res.send({ message: `Internal server error`, status: false })
                } else {
                    res.send({ message: `Profile photo uploaded successfully`, status: true })
                }
            })
        }
    })
}
const product = (req, res) => {
    productModel.find((err, result) => {
        if (err) {
            res.send({ message: `Internal server error`, status: false })
        } else {
            res.send({ result, status: true })
        }
    })
}
const payment = (req, res) => {
    const paymentReference = req.body.paymentReference
    const userId = req.body.userId
    const email = req.body.email
    const username = req.body.username
    const amountToPay = req.body.amountToPay
    if (paymentReference) {
        userModel.findOne({ '_id': userId }, (err, user) => {
            if (err) {
                res.send({ message: `Internal server error`, status: false })
            }
            else {
                var mailMessages = {
                    from: EMAIL,
                    to: email,
                    subject: 'Payment successfull!',
                    html: `<b class='card-title'>Dear ${username},</b>
                        <p >Congratulations! transaction of ${amountToPay} was successfull, for the purchase  of product at JFIX e-commerce.</p>
                        <p >Thanks for buying from JFIX e-commerce.</p>
                        Thank you!
                    `
                }
                transporter.sendMail(mailMessages, (err, info)=>{
                    if(err){
                        res.send({message:`Network error occur in the transaction`, status: false})
                    }else{
                        user.cartProduct = [];
                        userModel.updateOne({'_id': userId}, {'cartProduct': user.cartProduct}, (err, result)=>{
                            if(err){
                                res.send({message: `Network error`, status: false})
                            }
                            else{
                                res.send({message:`transaction successfull`, status: true})
                            }
                        })
                    }
                })
            }
        })
    }
    else {
        
        res.send({ message: `Dear ${email}, Your payment is not yet done, invalid payment!`, status: false })
        console.log(`Dear ${email}, Your payment is not yet done, invalid payment!`);
    }

}
const sendEmail = (req, res) => {
    const userEmail = req.body.email
    var transporter = nodemailer.createTransport({
        service: 'smtp@gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: EMAIL,
            pass: PASSWORD
        }
    })
    var mailMessages = {
        from: EMAIL,
        to: userEmail,
        subject: 'Registration Confirmation',
        html: `<b class='card-title'>Dear ${userEmail},</b>
            <p >Welcome to JFIX commerce site!</p>
            <p >Congratulations! your JFIX e-commerce account has been successfully created.</p>
            <p >With JFIX ecommerce, you will enjoy peace mind of shopping without cash involved. it's a simple, fast and secure.</p>
            Thank you!
        `
    }
    transporter.sendMail(mailMessages, (err, info) => {
        if (err) {
            res.send({message:`Error dey`, status: false})
        }
        else {
            res.send(`Email sent successfully: ${info.response}`)
        }
    })
}
const deleteAccount=(req, res)=>{
    const userEmail = req.body.email
    userModel.deleteOne({'email': userEmail}, (err, result)=>{
        if(err){
            res.send({message: `Network error, user not deleted`, status: false})
        }
        else{
            res.send({message: `Account deleted successfully`, status: true})
        }
    })
}
const contactMessage =(req, res)=>{
        const mailToSend={
            from: req.body.senderEmail,
            to: EMAIL,
            subject: `${req.body.senderName} send message to Ecomfix website- titled: ${req.body.senderTitle}`,
            text: `${req.body.senderMessage}`
        }
        transporter.sendMail(mailToSend, (err, info)=>{
            if(err){
                res.send({message: `Network error please check your connection, your message will be send automatically`, status: false})
            }else{
                res.send({message: `Message sent successfully`, status: true})
            }
        })
}
module.exports = { getLandingPage, signup, signin, home, getUser, getCart, cartProduct, removeCartItem, saveProfile, saveProfilePhoto, product, payment, sendEmail, deleteAccount, contactMessage }