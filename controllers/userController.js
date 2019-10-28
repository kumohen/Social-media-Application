const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow");

exports.home = async function(req,res){
    if(req.session.user){
        let posts = await Post.getFeed(req.session.user._id)
        res.render("home-dashboard",{posts});
    }else{
        res.render('home-guest',{regErrors:req.flash('regErrors')});
    }
    
}
exports.register = function(req,res){
    let user = new User(req.body);
    user.register().then(()=>{
        req.session.user = {avatar:user.avatar ,username:user.data.username,_id:user.data._id};
        req.session.save(()=>{
            res.redirect("/")
        })
    }).catch((regErrors)=>{
        regErrors.forEach(function(error){
            req.flash('regErrors',error)
       })
       req.session.save(()=>{
        res.redirect("/")
        })
    });

}
exports.login = function(req,res){
    let user = new User(req.body);
    user.login().then(function(result){
        req.session.user = { avatar:user.avatar, username:user.data.username,_id:user.data._id}
        req.session.save(()=>{
            res.redirect("/")
        })
    }).catch(function(e){
        req.flash("errors",e)
        req.session.save(()=>{
            res.redirect("/")
        })
    })
}
exports.logout = function(req,res){
    req.session.destroy(()=>{
        res.redirect("/");
    });
   
}
exports.loggedInMiddleware = function(req,res,next){
    if(req.session.user){
        next()
    }else{
        res.redirect("/")
    }
    
}
exports.ifUserExist = function(req,res,next){
    User.findByUsername(req.params.username).then(function(userDocument){
        req.profileUser = userDocument;
        next()
    }).catch(function(){
        res.render("404")
    })

}
exports.profilePostScreen = function(req,res){
    Post.findByAuthorId(req.profileUser._id).then(function(posts){
        res.render("profile",{
            posts:posts,
            profileUsername:req.profileUser.username,
            profileAvatar:req.profileUser.avatar,
            isFollowing:req.isFollowing,
            isVisitorProfile:req.isVisitorProfile,
            counts:{
                postCount:req.postCount,
                followerCount:req.followerCount,
                followingCount:req.followingCount 
            },
            currentPage:"posts"
        })
    }).catch(function(){
        res.render("404")
    })
    
}

exports.sharedProfileData =async function(req,res,next){
    let isFollowing = false
    let isVisitorProfile = false 
    if(req.session.user){
        isVisitorProfile = req.profileUser._id.equals(req.session.user._id) 
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id,req.visitorId)
      
    }
    req.isFollowing = isFollowing;
    req.isVisitorProfile = isVisitorProfile;

    let postCountPromise =  Post.countPostsByAuthor(req.profileUser._id);
    let followerCountPromise =  Follow.countFollowersById(req.profileUser._id);
    let followingCountPromise =  Follow.countFollowingById(req.profileUser._id);
    let [postCount,followerCount,followingCount] = await Promise.all([postCountPromise,followerCountPromise,followingCountPromise]);
    req.postCount = postCount;
    req.followerCount=followerCount;
    req.followingCount = followingCount;
  
    next()
}

exports.profileFollowersScreen = async function(req,res){
   try {
   
    let followers = await Follow.getFollowersById(req.profileUser._id)
    
    
    res.render("profile-followers",{
        profileUsername:req.profileUser.username,
        profileAvatar:req.profileUser.avatar,
        isFollowing:req.isFollowing,
        isVisitorProfile:req.isVisitorProfile,
        followers:followers,
        counts:{
            postCount:req.postCount,
            followerCount:req.followerCount,
            followingCount:req.followingCount 
        },
        currentPage:"followers"
    });
   } catch  {
       res.render("404")
   }
    
}
exports.profileFollowingScreen = async function(req,res){
    try {
   
        let followering = await Follow.getFolloweringById(req.profileUser._id)
        
        
        res.render("profile-followering",{
            profileUsername:req.profileUser.username,
            profileAvatar:req.profileUser.avatar,
            isFollowing:req.isFollowing,
            isVisitorProfile:req.isVisitorProfile,
            followering:followering,
            counts:{
                postCount:req.postCount,
                followerCount:req.followerCount,
                followingCount:req.followingCount 
            },
            currentPage:"following"
        });
       } catch  {
           res.render("404")
       }
}

exports.doesUsernameExist = function(req,res){
    User.findByUsername(req.body.username).then(()=>{
        res.json(true)
    }).catch(()=>{
        res.json(false)
    })
}
exports.doesEmailExist = async function(req,res){
   let emailBool = await User.doesEmailExist(req.body.email)
   res.json(emailBool)
}