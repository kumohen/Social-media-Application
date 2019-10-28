const postCollection = require("../db").db().collection("posts");
const followesCollection = require("../db").db().collection("follows");
const ObjectID = require("mongodb").ObjectID;
const User = require("./User");
const sanitizeHTML = require("sanitize-html");

let Post = function(data,userid,requestedPostId){
    this.data =data
    this.errors = []
    this.userid=userid
    this.requestedPostId = requestedPostId
}
Post.prototype.cleanUp = function(){
    if(typeof(this.data.title) != "string"){this.data.title === ""}
    if(typeof(this.data.body) != "string"){this.data.body === ""}

    this.data = {
        title:this.data.title.trim(),
        body:sanitizeHTML(this.data.body.trim(),{
            allowedTags:[],allowedAttributes:{}
        }),
        createdDate:new Date(),
        author:ObjectID(this.userid)
    }
}
Post.prototype.validate = function(){
    if(this.data.title === '') {this.errors.push("You must provide a title")}
    if(this.data.body === '') {this.errors.push("You must Provide  a body")}
}

Post.prototype.create = function(){
    return new Promise((resolve,reject)=>{
        this.cleanUp();
        this.validate()
        if(!this.errors.length){
            postCollection.insertOne(this.data).then((info)=>{
                resolve(info.ops[0]._id)
            }).catch(()=>{
                this.errors.push("please try again");
                reject(this.errors)
            })
          
        }else{
            reject(this.errors)
        }
    })
}

Post.prototype.update = function(){
    return new Promise(async(resolve,reject)=>{
        try {
            let post = await Post.findSingleById(this.requestedPostId,this.userid)
            if(post.isVisitorOwner){
              let status =   await this.actuallyUpdate()
              resolve(status)
            }else{
                reject()
            }
        } catch (error) {
            reject()
        }
    })
}

Post.prototype.actuallyUpdate = function(){
    return new Promise(async(resolve,reject)=>{
        this.cleanUp()
        this.validate()
        if(!this.errors.length){
           await postCollection.findOneAndUpdate({_id:new ObjectID(this.requestedPostId)},{$set:{title:this.data.title,body:this.data.body}})
          
           resolve("success")
        }else{
            resolve("failure")
        }
    })
}

Post.findSingleById = function(id,visitorId){
    return new Promise(async function(resolve,reject){
        if(typeof(id) != "string" || !ObjectID.isValid(id)){
            reject()
            return 
        }
       let posts = await Post.reuseablePostQuery([
           {$match:{_id:new ObjectID(id)}}
       ],visitorId)
        if(posts.length){
           
            resolve(posts[0])
        }else{
            reject()
        }
    })
}
Post.reuseablePostQuery = function(uniqueOperations,visitorId){
    return new Promise(async function(resolve,reject){
       let aggOperations = uniqueOperations.concat([
          
        {$lookup:{from:"user" ,localField:"author",foreignField:"_id",as:"authorDocument"}},
        {$project:{
            title:1,
            body:1,
            createdDate:1,
            authorId:"$author",
            author:{$arrayElemAt:["$authorDocument",0]}
        }}
    ])
        let posts = await postCollection.aggregate(aggOperations).toArray()
        posts = posts.map(function(post){
            post.isVisitorOwner = post.authorId.equals(visitorId);
             post.authorId = undefined
            post.author = {
               user:post.author.username,
               avatar:new User(post.author,true).avatar
            }
            return post
        })
        resolve(posts)
    })
}
Post.findByAuthorId = function(authorId){
    return Post.reuseablePostQuery([
        {$match:{author:authorId}},
        {$sort:{createdDate:1}}
    ]);
}

Post.delete = function(postId,visitorId){
    return new Promise(async(resolve,reject)=>{
        try {
           let post = await Post.findSingleById(postId,visitorId) ;
           if(post.isVisitorOwner){
           await postCollection.deleteOne({_id:new ObjectID(postId)})
           resolve()
           }else{
            reject()
           }
        } catch (error) {
            reject()
        }
    })
}
Post.search=function(searchTerm){
    return new Promise(async(resolve,reject)=>{
        if(typeof(searchTerm) == "string"){
            let posts = await Post.reuseablePostQuery([
              {$match:{$text:{$search:searchTerm}}},
              {$sort:{score:{$meta:"textScore"}}}  
            ])
            resolve(posts)
        }else{
            reject()
        }
    })
}
Post.countPostsByAuthor = function(id){
    return new Promise(async(resolve,reject)=>{
       let postCount = await postCollection.countDocuments({author:id})
       resolve(postCount)
    })
}
Post.getFeed = async function(id){
    let followedUsers = await followesCollection.find({authorId:new ObjectID(id)}).toArray() 
    followedUsers = followedUsers.map(function(followDoc){
        return followDoc.followedId
    })
    return Post.reuseablePostQuery([
        {$match:{author:{$in:followedUsers}}},
        {$sort:{createdDate:-1}}
    ])
}

module.exports = Post 