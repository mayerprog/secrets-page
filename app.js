require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const Auth = require("./schemas/authSchema");
const session = require("express-session");
const passport = require("passport");
const findOrCreate = require("mongoose-findorcreate");
var GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();

app.use(express.urlencoded({ extended: false }));

app.use(express.static("public")); // express serves it out as a static folder

app.set("view engine", "ejs");

app.use(
  session({
    //initialized session
    secret: "our little secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session()); //for dealing with the session

passport.use(Auth.createStrategy()); //local strategy to authenticate users using their username and password

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      // set up google strategy
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
      Auth.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

app.get("/", async (req, res) => {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/login", async (req, res) => {
  res.render("login");
});

app.get("/register", async (req, res) => {
  res.render("register");
});

app.get("/secrets", async(req, res) => {
  try {
    const foundUsers = await Auth.find({"secret": {$ne: null}}) //to check whether the secret field is not equal (ne) to null
    console.log(foundUsers)
    if(foundUsers) {
      res.render("secrets", {usersWithSecrets: foundUsers})
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.render("login");
  }
});

app.get("/logout", async (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post("/submit", async(req, res) => {
  const submittedSecret = req.body.secret
  const foundUser = await Auth.findById(req.user._id)
    if(foundUser) {
      foundUser.secret = submittedSecret
    } 
  try {
    await foundUser.save()
    res.redirect("/secrets")
  } catch(err) {
    res.status(400).json({ message: err.message })
  }
});

app.post("/register", (req, res) => {
  Auth.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", (req, res) => {
  const newAuth = new Auth({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(newAuth, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
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
