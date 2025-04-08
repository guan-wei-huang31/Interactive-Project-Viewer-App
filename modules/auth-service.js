require("dotenv").config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
let Schema = mongoose.Schema;

// connect to MongoDB Atlas Database
//mongoose.connect(process.env.mongoose);
/*
mongoose.connection.on("open", () => {
    console.log("Database connection open.");
    });
*/
let userSchema = new Schema({
    userName: {
        type: String,
        unique: true,
    },
    password: String,
    email: String,
    loginHistory: [{
        dateTime: Date,
        userAgent: String,
    }]
})

let User;

function initialize(){
    return new Promise(function (resolve, reject) {
        // Create connection
        let db = mongoose.createConnection(process.env.MONGODB);

        //Fail connection
        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });

        //Success connection
        db.once('open', ()=>{
            User = db.model("users", userSchema);  // initialize user model
            resolve();
        });
    });
}

function registerUser(userData){
    return new Promise((resolve, reject)=>{
        //Validate password == password2
        if (userData.password != userData.password2){
            reject("Passwords do not match");
            return;
        }
        bcrypt.hash(userData.password, 10)
        .then(hash=>{ // Hash the password using a Salt that was generated using 10 rounds
            userData.password = hash;
            // TODO: Store the resulting "hash" value in the DB
            //Build new user
            let newUser = new User({
                userName: userData.userName,
                password: userData.password,
                email: userData.email,
                loginHistory: []
            })
            //Save user data
            newUser.save()
                .then(()=>{
                    resolve();
                })
                .catch((err)=>{
                    if (err.code === 11000){
                        reject("User Name already taken");
                    }else{
                        reject("There was an error creating the user: " + err);
                    }
                });
        })
        .catch((err)=>{
            reject("There was an error encrypting the password");
        });
    });
}

function checkUser(userData){
    return new Promise((resolve, reject)=>{
        User.find({userName: userData.userName})  // "find" will return an array
            .then(users=>{
                // If no user found, array size is 0
                if (users.length === 0){
                    reject("Unable to find user: " + userData.userName);
                    return;
                }

                //encrypted
                const storedUser = users[0];
                bcrypt.compare(userData.password, storedUser.password)
                .then(result=>{
                    if (!result) {
                        reject("Incorrect Password for user: " + userData.userName);
                        return;
                    }

                    // Pop data when num of items in history is 8
                    if (storedUser.loginHistory.length === 8) {
                        storedUser.loginHistory.pop();
                    }

                    // Add new history 
                    storedUser.loginHistory.unshift({
                        dateTime: (new Date()).toString(), 
                        userAgent: userData.userAgent
                    });

                    //Update history data to MongoDB
                    User.updateOne(
                        { userName: storedUser.userName },
                        { $set: { loginHistory:storedUser.loginHistory } }
                    )
                    .then(()=>{
                        resolve(storedUser);
                    })
                    .catch(err=>{
                        reject("There was an error verifying the user: " + err);
                    });
                })
                .catch((err)=>{
                    reject("There was an error comparing passwords");
                });
            })
            .catch(()=>{   //If cannot "find" 
                reject("Unable to find user: " + userData.userName);
            });
    });
}

module.exports = { 
    initialize, 
    registerUser, 
    checkUser 
};