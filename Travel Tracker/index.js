import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user : "postgres",
  database : "world",
  password : "kanhaiya",
  host : "localhost",
  port : 5432,

});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


 db.connect();
app.get("/", async (req, res) => {
  //Write your code here.
   const countries = await checkVisisted();
   console.log("countries" ,countries);
   console.log("length", countries.length);
   res.render("index.ejs" , {
    total : countries.length,
    countries : countries,
    
  });

});


app.post("/add" , async (req,res) => {
  //db.connect();
  const countryNameAdded = req.body["country"];

  try {
  const result = await db.query("SELECT country_code FROM countries WHERE LOWER(countries.country_name) = $1",[countryNameAdded.toLowerCase()]);

    const data = result.rows[0];
    const countryCode = data.country_code;
    try{
    await db.query("INSERT INTO visited_countries ( country_code ) VALUES ($1)",[countryCode,]);
    res.redirect("/");
    }catch(err){
      console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again.",
      });
    }
  }catch(err){
    console.log(err);
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
  }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});



// async function dataBase(){
// let result= [];
// const countryCodeArray = [];
//  await db.query("SELECT country_code FROM visited_countries", (err,res) => {
//     if(err){
//       console.log("Error in fetching data",err.stack);
//     }
//     else{
//       result = res.rows;
//     }
    
//     // db.end();
//   });
//   for (var i = 0; i < result.length; i++) {
//     countryCodeArray.push(result[i].country_code);
//   }
//   // console.log(result);
//   // console.log(countryCodeArray);
//   return countryCodeArray;
// }

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");

  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}