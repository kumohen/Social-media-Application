const express = require("express")
const session = require("express-session");
const MongoStore = require('connect-mongo')(session);
const markdown = require("marked");
const sanitizeHTML = require("sanitize-html");
const csrf = require("csurf");
const flash = require('connect-flash');
const db = require("./db");
const app = express();

app.use(express.urlencoded({extended:false}))
app.use(express.json())

app.use("/api",require("./router-api"));

let sessionOptions = session({
    secret: 'keyboard cat',
    store: new MongoStore({ client:db}),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge:1000*60 *60*24 }
  })
app.use(sessionOptions);
app.use(flash());

app.use(function(req,res,next){
  res.locals.userFilterHtml = function(content){
    return sanitizeHTML(markdown(content),{
      allowedTags:['p','br','li','ul','ol','strong','bold'],allowedAttributes:{}
    })
  }
  if(req.session.user){
    req.visitorId = req.session.user._id
  }else{
    req.visitorId = 0
  }
  res.locals.user = req.session.user ;
  res.locals.errors = req.flash("errors")
  res.locals.success = req.flash("success")
  next()
})

app.use(express.static('public'));

app.set("views","views");
app.set("view engine","ejs");

app.use(csrf());
app.use(function(req,res,next){
  res.locals.csrfToken = req.csrfToken()
  next()
})

app.use("/",require("./routes"))
app.use(function(err,req,res,next){
  if(err){
    if(err.code == 'EBADCSRFTOKEN'){
      req.flash("errors","crros site error detected")
      req.session.save(()=>{
        res.redirect("/")
      })
    }else{
      res.render("404")
    }
  }
})

const server = require("http").createServer(app)
const io = require("socket.io")(server)

io.use(function(socket, next){
  sessionOptions(socket.request,socket.request.res,next)
});

io.on("connection",function(socket){
    if(socket.request.session.user){
      let user = socket.request.session.user
      socket.emit('welcome',{
        username:user.username,avatar:user.avatar
      })
      socket.on('chatMessageFromBrowser',function(data){
        socket.broadcast.emit('chatMessageFromServer',{ message:sanitizeHTML(data.message,{
          allowedTags:[],allowedAttributes:{}
        }) ,username:user.username,avatar:user.avatar})
      })
    }
   // console.log("a new user connected")
})

module.exports = server;