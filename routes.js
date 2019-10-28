const router = require("express").Router();
const {home,register,login,logout,profileFollowersScreen,profileFollowingScreen,doesUsernameExist,doesEmailExist,
    loggedInMiddleware,ifUserExist,profilePostScreen,sharedProfileData} = require("./controllers/userController");
const {viewCreatePost,createPost,viewSinglePost,viewEditPost,editPost,deletePost,search} = require("./controllers/postController");
const {addFollow,removeFollow} = require("./controllers/followController");
router.get("/",home);
router.post("/register",register);
router.post("/login",login);
router.post("/logout",logout);

router.post("/doesUsernameExist",doesUsernameExist)
router.post("doesEmailExist",doesEmailExist);

//propile 
router.get("/profile/:username",ifUserExist,sharedProfileData,profilePostScreen)
router.get("/profile/:username/followers",ifUserExist,sharedProfileData,profileFollowersScreen)
router.get("/profile/:username/following",ifUserExist,sharedProfileData,profileFollowingScreen)
//user post 

router.get("/create-post",loggedInMiddleware,viewCreatePost);
router.post("/search",search)
router.post("/create-post",loggedInMiddleware,createPost);
router.get("/post/:id",viewSinglePost);
router.get("/post/:id/edit",loggedInMiddleware,viewEditPost);
router.post("/post/:id/edit",loggedInMiddleware,editPost);
router.post("/post/:id/delete",loggedInMiddleware,deletePost);

//follow related route
router.post("/addFollow/:username",loggedInMiddleware,addFollow);
router.post("/removeFollow/:username",loggedInMiddleware,removeFollow);

// 


module.exports = router;