const validator = require("validator");
const bcrypt = require("bcryptjs");
const md5 = require('md5');
const userCollection = require("../db").db().collection("user");

let User = function(data,getAvatar){
    this.data =data;
    this.errors=[]
    if(getAvatar === undefined){
        getAvatar = false
    }
    if(getAvatar) {this.getAvatar()}
}
    User.prototype.cleanUp = function(){
        if(typeof(this.data.username) != "string"){this.data.username === ""}
        if(typeof(this.data.email) != "string"){this.data.email === ""}
        if(typeof(this.data.password) != "string"){this.data.password === ""}
        this.data ={
            username:this.data.username.trim(),
            email:this.data.email,
            password:this.data.password
        }
    }

User.prototype.validate = function(){
    return new Promise(async (resolve,reject)=>{
        if(this.data.username === '') {this.errors.push("must be a username")}
        if(this.data.username != '' && !validator.isAlphanumeric(this.data.username)){this.errors.push("no sepcial character will be here")}
        if(!validator.isEmail(this.data.email)) {this.errors.push("must be a email")}
        if(this.data.password === '') {this.errors.push("must be a password")}
        if(this.data.username > 2 && this.data.username.length < 21 && validator.isAlphanumeric(this.data.username)){
            let userExist = await userCollection.findOne({username:this.data.username})
            if(userExist){
                this.errors.push("This username already exist,take another one")
            }
        }
        if( validator.isEmail(this.data.email)){
            let emailExist = await userCollection.findOne({email:this.data.email})
            if(emailExist){
                this.errors.push("This email already exist,take another one")
            }
        }
        resolve()
    })
}
User.prototype.register = function(){
    return new Promise(async (resolve,reject)=>{
        this.cleanUp();
        await this.validate();
        if(!this.errors.length){
            let salt = bcrypt.genSaltSync(10);
            this.data.password =bcrypt.hashSync(this.data.password,salt);
            userCollection.insertOne(this.data);
            this.getAvatar();
            resolve()
        }else{
            reject(this.errors)
        }
    })
   
}

User.prototype.login = function(){
   return new Promise((resolve,reject)=>{
    this.cleanUp();
    userCollection.findOne({username:this.data.username}).then((user)=>{
        if(user && bcrypt.compareSync(this.data.password,user.password)){
            this.data = user;
            this.getAvatar();
            resolve("congrats");
        }else{
            reject("password is worng")
        }
    }).catch(function(){
        reject("password is worng")
    })
   })
}

User.prototype.getAvatar = function(){
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
    
}
User.findByUsername = function(username){
    return new Promise(function(resolve,reject){
        if(typeof(username) != "string" ){
            reject()
            return 
        }
        userCollection.findOne({username:username}).then(function(userDoc){
            if(userDoc){
                userDoc = new User(userDoc,true)
                userDoc={
                    _id:userDoc.data._id,
                    username:userDoc.data.username,
                    avatar:userDoc.avatar
                }
                resolve(userDoc)
            }else{
                reject()
            }
        }).then(function(){
            reject()
        })
    })
}
User.doesEmailExist = function(email){
    return new Promise(async(resolve,reject)=>{
        if(typeof(email) != "string"){
            resolve(false)
            return
        }
        let user = await userCollection.findOne({email:email})
        if(user){
            resolve(true)
        }else{
            resolve(false)
        }
    })
}

module.exports = User;
