//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import flash from 'express-flash';
import { Strategy as GoogleStrategy } from "passport-google-oauth2";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));


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


passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if the user already exists in the database
    const user = await db.query("SELECT * FROM user_detail WHERE googleId = $1", [profile.id]);

    if (user.rows.length > 0) {
      // If the user exists, return the user
      return done(null, user.rows[0]);
    } else {
      // If the user doesn't exist, create a new user in the database
      const newUser = await db.query("INSERT INTO user_detail (googleId, email, displayName) VALUES ($1, $2, $3) RETURNING *",
        [profile.id, profile.email, profile.displayName]);
      
      return done(null, newUser.rows[0]);
    }
  } catch (err) {
    return done(err, null);
  }
}
));

// Passport local strategy for authentication
passport.use(new LocalStrategy(async (email, password, done) => {
    try {
      const user = await db.query("SELECT * FROM user_detail WHERE email=($1)", [email]);
      const userObj = user.rows[0];
  
      if (!userObj) {
        return done(null, false, { message: 'Incorrect email, Try Again.' });
      }
  
      bcrypt.compare(password, userObj.password, (err, result) => {
        if (err) {
          return done(err);
        }
  
        if (result) {
          return done(null, userObj);
        } else {
          return done(null, false, { message: 'Incorrect password, Try Again.' });
        }
      });
    } catch (err) {
      return done(err);
    }
  }));

passport.serializeUser((user, done) => {
  console.log("Serializing user:", user);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
      const user = await db.query("SELECT * FROM user_detail WHERE id = $1", [id]);
      done(null, user.rows[0]);
  } catch (err) {
      done(err, null);
  }
});




app.get("/", (req,res)=>{
    res.render("home.ejs");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));

  app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login "}),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
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
     // Check if email and password are provided for manual registration
     if (!email || !password) {
      return res.render("register.ejs", { error: "Email and password are mandatory fields." });
     }
     // Check if the user is already registered
    const existingUser = await db.query("SELECT * FROM user_detail WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
        return res.render("register.ejs", { error: "User with this email is already registered." });
    }
    bcrypt.hash(password, parseInt(process.env.SALTROUNDS), async (err, hash) => {
      try {
        await db.query("INSERT INTO user_detail (email, password) VALUES ($1, $2)", [email, hash]);
        res.render("login.ejs",{message : "Registered Successfully !,Login with your registered Email Id and password"});
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
  

app.get("/secrets", async(req, res) => {
  console.log("Request to /secrets received.");
  console.log("Is Authenticated?", req.isAuthenticated());

  if (req.isAuthenticated()) {
    try {
      // Fetch non-null secrets from the database
      const nonNullSecrets = await db.query("SELECT secret FROM user_detail WHERE secret IS NOT NULL");

      // Render the secrets page with non-null fetched secrets
      res.render("secrets.ejs", { userWithSecret: nonNullSecrets.rows });
  } catch (error) {
      console.error("Error fetching secrets:", error);
      res.redirect("/login");
  }
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
app.get("/submit",(req,res) => {
  if (req.isAuthenticated()) {
    res.render("submit.ejs");
  } else {
    console.log("User not authenticated. Redirecting to /login");
    res.redirect("/login");
  }
});
app.post("/submit", async (req, res) => {
  // Check if the user is authenticated (example: check if there's a user session)
  if (!req.session || !req.session.passport || !req.session.passport.user) {
    console.log("User not authenticated");
    return res.redirect("/login"); // Redirect to the login page if not authenticated
  }

  const userId = req.session.passport.user; // Assuming you store user information in the session
  //console.log(userId);
  const submittedSecret = req.body.secret;

  try {
      // Insert the submitted secret into the database 
      await db.query("UPDATE user_detail SET secret = $1 WHERE id = $2", [submittedSecret, userId]);
      res.redirect("/secrets"); // Redirect to a page displaying secrets
  } catch (error) {
      console.log(error);
      res.redirect("/submit"); // Redirect to the submission page in case of an error
  }
});


app.listen(port , ()=> {
    console.log(`Server Listening on port ${port}`);
});
