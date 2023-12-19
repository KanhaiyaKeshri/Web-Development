//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import pg from "pg";

const app = express();
const port = 3000;

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
    try{
        await db.query("INSERT INTO user_detail (email, password) VALUES ($1, pgp_sym_encrypt(($2), ($3)))", 
        [email, password, process.env.SECRET]);
    }catch(err)
    {
        console.log(err);
    }
    res.render("secrets.ejs");
});
let user = []; 
app.post("/login", async(req,res) =>{

    const email = req.body.username;
    const password = req.body.password;
    try{
      user = await db.query("SELECT email, pgp_sym_decrypt(password, ($1)) AS password FROM user_detail WHERE email=($2)",
       [process.env.SECRET, email]);
     
    }catch(err)
    {
        console.log(err);
        res.redirect("/login");
    }
    
    const pass = user.rows[0];
    const result = pass.password;
  
    
    if(result === password){
        res.render("secrets.ejs");
    }
    else{
        console.log("User Entered password=".password);
        console.log("Actual password = ", result);
        res.redirect("/login");
    }

});
app.get("/logout",(req,res) =>{
    res.redirect("/");
});

app.listen(port , ()=> {
    console.log(`Server Listening on port ${port}`);
});
