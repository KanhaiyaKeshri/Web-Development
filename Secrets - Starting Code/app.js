//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import pg from "pg";
import bcrypt from "bcrypt";

const app = express();
const port = 3000;
const saltRounds = 10;

const db = new pg.Client({
    user : "postgres",
    password : "kanhaiya",
    database : "authenticate",
    host : "localhost",
    port : 5432
});
db.connect();

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));
//app.set('view engine','ejs');


app.get("/", (req,res)=>{
    res.render("home.ejs");
});

app.get("/login",(req,res) => {
    res.render("login.ejs");
});
app.get("/register", (req,res) => {
    res.render("register.ejs");
});

app.post("/register", async(req,res) =>{
    const email = req.body.username;
    const password = req.body.password;
      bcrypt.hash(password, saltRounds, function(err, hash) {
         try{
           db.query("INSERT INTO user_detail (email, password) VALUES ($1, $2)", 
            [email, hash]);
        }catch(error)
        {
            console.log(error);
        }
        res.render("secrets.ejs");
    });
   
});
let user = []; 
app.post("/login", async(req,res) =>{

    const email = req.body.username;
    const password = req.body.password;
    try{
      user = await db.query("SELECT email, password FROM user_detail WHERE email=($1)",
       [email]);
     
    }catch(err)
    {
        console.log(err);
        res.redirect("/login");
    }
    
    const pass = user.rows[0];
    const result1 = pass.password;
  
    
    bcrypt.compare(password, result1, function(err, result) {
        // result == true
        if(result === true)
        {
            res.render("secrets.ejs");
        }
        else{
            console.log("User Entered password=".password);
            console.log("Actual password = ", result);
            res.redirect("/login");
        }
    });
        

});
app.get("/logout",(req,res) =>{
    res.redirect("/");
});

app.listen(port , ()=> {
    console.log(`Server Listening on port ${port}`);
});
