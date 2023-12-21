//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import flash from 'express-flash';

const app = express();
const port = 3000;
 const saltRounds = 10;
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));
//app.set('view engine','ejs');

const db = new pg.Client({
    user : "postgres",
    password : "kanhaiya",
    database : "authenticate",
    host : "localhost",
    port : 5432
});

app.use(session({
    secret: "I am a Boy.",
    resave: false,
    saveUninitialized: false,
  }));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); 

db.connect();

// Passport local strategy for authentication
passport.use(new LocalStrategy(async (email, password, done) => {
    try {
      const user = await db.query("SELECT email, password FROM user_detail WHERE email=($1)", [email]);
      const userObj = user.rows[0];
  
      if (!userObj) {
        return done(null, false, { message: 'Incorrect email.' });
      }
  
      bcrypt.compare(password, userObj.password, (err, result) => {
        if (err) {
          return done(err);
        }
  
        if (result) {
          return done(null, userObj);
        } else {
          return done(null, false, { message: 'Incorrect password.' });
        }
      });
    } catch (err) {
      return done(err);
    }
  }));

  // Passport serialize and deserialize user
passport.serializeUser((user, done) => {
    done(null, user.email);
  });
  
  passport.deserializeUser(async (email, done) => {
    try {
      const user = await db.query("SELECT email FROM user_detail WHERE email=($1)", [email]);
      done(null, user.rows[0]);
    } catch (err) {
      done(err, null);
    }
  });


app.get("/", (req,res)=>{
    res.render("home.ejs");
});

app.get("/login",(req,res) => {
    res.render("login.ejs", { message : req.flash('error')});
});
app.get("/register", (req,res) => {
    res.render("register.ejs");
});


app.post("/register", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
  
    bcrypt.hash(password, saltRounds, async (err, hash) => {
      try {
        await db.query("INSERT INTO user_detail (email, password) VALUES ($1, $2)", [email, hash]);
        res.render("secrets.ejs");
      } catch (error) {
        console.log(error);
        res.redirect("/register");
      }
    });
  });
      

app.post("/login", passport.authenticate('local', {
    successRedirect: "/secrets",
    failureRedirect: '/login',
    failureFlash: true // Enable flash messages for authentication failures
  }));
  

app.get("/secrets", (req, res) => {
  console.log("Request to /secrets received.");
  console.log("Is Authenticated?", req.isAuthenticated());

  if (req.isAuthenticated()) {
    res.render("secrets.ejs");
  } else {
    console.log("User not authenticated. Redirecting to /login");
    res.redirect("/login");
  }
});
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect("/");
  });
});


app.listen(port , ()=> {
    console.log(`Server Listening on port ${port}`);
});
