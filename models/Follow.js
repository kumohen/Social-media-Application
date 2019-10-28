const userCollection = require("../db").db().collection("user");
const followesCollection = require("../db").db().collection("follows");
const ObjectID = require("mongodb").ObjectID;
const User = require("./User");

let Follow = function(followedUsername,authorId){
    this.followedUsername=followedUsername
    this.authorId=authorId
    this.errors=[]
}
Follow.prototype.cleanUp = async function(){
    if(typeof(this.followedUsername) != "string"){this.followedUsername = ""}
}
Follow.prototype.validate = async  function(action){
    console.log("this.followedUsername",this.followedUsername)
    let followedAccount = await userCollection.findOne({username:this.followedUsername})
    
    if(followedAccount){
        this.followedId = followedAccount._id
    }else{
        this.errors.push("you can followed a this account")
    }
    let doesFollowAlreayExists =await followesCollection.findOne({followedId:this.followedId,authorId:new ObjectID(this.authorId)})
    if(action == "create"){
        if(doesFollowAlreayExists){
            this.push.errors("You are already followed this user")
        }
    }
    if(action == "delete"){
        if(!doesFollowAlreayExists){
            this.push.errors("You can't stop following this account")
        }
    }
    if(this.followedId.equals(this.authorId)){
        this.push.errors("You can't follow yourself")
    }
}
Follow.prototype.create = function(){
    return new Promise(async(resolve,reject)=>{
        this.cleanUp();
        await this.validate("create")
        if(!this.errors.length){
           await followesCollection.insertOne({followedId:this.followedId,authorId:new ObjectID(this.authorId)})
           resolve()
        }else{
            reject(this.errors)
        }
    }) 
}
Follow.prototype.delete = function(){
    return new Promise(async(resolve,reject)=>{
        this.cleanUp();
        await this.validate("delete")
        if(!this.errors.length){
           await followesCollection.deleteOne({followedId:this.followedId,authorId:new ObjectID(this.authorId)})
           resolve()
        }else{
            reject(this.errors)
        }
    }) 
}
Follow.isVisitorFollowing =async function(followedId,visitorId){
    
    let followDoc = await followesCollection.findOne({followedId:followedId,authorId:new ObjectID(visitorId)})
    if(followDoc){
        return true
    }else{
        return false
    }
}
Follow.getFollowersById = function(id) {
    return new Promise(async (resolve, reject) => {
      try {
        let followers = await followesCollection.aggregate([
          {$match: {followedId: id}},
          {$lookup: {from: "user", localField: "authorId", foreignField: "_id", as: "userDoc"}},
          {$project: {
            username: {$arrayElemAt: ["$userDoc.username", 0]},
            email: {$arrayElemAt: ["$userDoc.email", 0]}
          }}
        ]).toArray()
        followers = followers.map(function(follower) {
          let user = new User(follower, true)
          return {username: follower.username, avatar: user.avatar}
        })
        resolve(followers)
      } catch {
        reject()
      }
    })
  }
  Follow.getFolloweringById = function(id) {
    return new Promise(async (resolve, reject) => {
      try {
        let followers = await followesCollection.aggregate([
          {$match: {authorId: id}},
          {$lookup: {from: "user", localField: "followedId", foreignField: "_id", as: "userDoc"}},
          {$project: {
            username: {$arrayElemAt: ["$userDoc.username", 0]},
            email: {$arrayElemAt: ["$userDoc.email", 0]}
          }}
        ]).toArray()
        followers = followers.map(function(follower) {
          let user = new User(follower, true)
          return {username: follower.username, avatar: user.avatar}
        })
        resolve(followers)
      } catch {
        reject()
      }
    })
  }

  Follow.countFollowersById = function(id){
    return new Promise(async(resolve,reject)=>{
       let followerCount = await followesCollection.countDocuments({followedId:id})
       resolve(followerCount)
    })
}
Follow.countFollowingById = function(id){
    return new Promise(async(resolve,reject)=>{
       let followingCount = await followesCollection.countDocuments({authorId:id})
       resolve(followingCount)
    })
}

module.exports = Follow