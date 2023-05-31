const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const Auth = require("./schemas/authSchema");
const session = require("express-session")
const passport = require("passport")

const app = express();

app.use(express.urlencoded({ extended: false }));

app.use(express.static("public")); // express serves it out as a static folder

app.set("view engine", "ejs");

app.use(session({ //initialized session
  secret: 'our little secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true }
}))
 
app.use(passport.initialize())
app.use(passport.session()) //for dealing with the session

passport.use(Auth.createStrategy()); //local strategy to authenticate users using their username and password
passport.serializeUser(Auth.serializeUser());
passport.deserializeUser(Auth.deserializeUser());

mongoose.connect("mongodb://127.0.0.1:27017/userDB");


app.get("/", async (req, res) => {
  res.render("home");
});

app.get("/login", async (req, res) => {
  res.render("login");
});

app.get("/register", async (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  if(req.isAuthenticated()){
    res.render("secrets");
  } else {
    res.render("login");
  }
});

app.post("/register", (req, res) => {
  Auth.register({username: req.body.username}, req.body.password, (err, user) => {
    if (err) { 
      console.log(err)
      res.redirect("/register")
    } else {
      passport.authenticate("local")(req,res, () => {
        res.redirect("/secrets")
      })
    }
  })
})


app.post("/login", (req, res) => {
  const newAuth = new Auth({
    username: req.body.username,
    password: req.body.password
  })
  req.login(newAuth, (err, user) => {
    if (err) { 
      console.log(err)
    } else {
      passport.authenticate("local")(req,res, () => {
        res.redirect("/secrets")
      })
    }
  })
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});

// REGISTER
 
//   const email = req.body.username;
//   const password = req.body.password

//   bcrypt.hash(password, saltRounds, async(err, hash) => {
//       const newAuth = new Auth({
//         email: email,
//         password: hash,
//       });
//       try {
//         await newAuth.save();
//         res.redirect("/secrets");
//       } catch (err) {
//         res.status(500).json({ message: err.message });
//       }
// });

// LOGIN

// const email = req.body.username;
//   const password = req.body.password

//     try {
//       const foundUser = await Auth.findOne({ email: email });
//       if (foundUser) {
//         bcrypt.compare(password, foundUser.password, function(err, result) {
//           result === true && res.redirect("/secrets")
//         })
//     }
//    } catch (err) {
//       res.status(500).json({ message: err.message });
//     }