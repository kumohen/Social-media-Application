const Post = require("../models/Post");

exports.viewCreatePost = (req,res)=>{
    res.render("create-post")
}
exports.createPost = (req,res)=>{
    let post = new Post(req.body,req.session.user._id);
    post.create().then(function(newId){
        req.flash("success","New Post is created")
        req.session.save(function(){
            res.redirect(`/post/${newId}`)
        })
    }).catch(function(errors){
        errors.forEach(error => req.flash("errors",error))
        req.session.save(()=> res.redirect("/create-post"))
    })
}
exports.viewSinglePost = async(req,res)=>{
    try {
        let post = await Post.findSingleById(req.params.id,req.visitorId);
        res.render("single-post-screen",{post:post,title:post.title})
    } catch (error) {
        res.render("404")
    }
}
exports.viewEditPost =async (req,res)=>{
   try {
    let post =  await Post.findSingleById(req.params.id)
    if(post.authorId == req.visitorId ){
        res.render("edit-post",{post})  
    }else{
        req.flash("errors","You don't have permission")
        req.session.save(function(){
            res.redirect(`/`)
        })
    }
   } catch (error) {
       res.render("404")
   } 
}
exports.editPost = (req,res)=>{
    let post = new Post(req.body,req.visitorId,req.params.id);
    post.update().then((status)=>{
        if(status === "success"){
            req.flash("success","post successfully updated")
            req.session.save(function(){
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }else{
            post.errors.forEach(function(error){
                req.flash("errors",error)
            })
            req.session.save(function(){
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }
    }).catch(()=>{
        req.flash("errors","you dont have permission")
        req.session.save(function(){
            res.redirect("/")
        })
    })
}
exports.deletePost = function(req,res){
    Post.delete(req.params.id,req.visitorId).then(()=>{
        req.flash("success","post successfully deleted");
        req.session.save(function(){
            res.redirect(`/profile/${req.session.user.username}`)
        })
    }).catch(()=>{
        req.flash("errors","you dont have permission")
        req.session.save(function(){
            res.redirect("/")
        })
    })
}

exports.search = function(req,res){
    Post.search(req.body.searchTerm).then((posts)=>{
        res.json(posts)
    }).catch(()=>{
        res.json([])
    })
}