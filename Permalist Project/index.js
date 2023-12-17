import express from "express";
import bodyParser from "body-parser";
import pg from "pg";


const app = express();
const port = 3000;
const db = new pg.Client({
  database : "permalist",
  user : "postgres",
  host : "localhost",
  password : "kanhaiya",
  port : 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

db.connect();

let items = [
  { id: 1, title: "Buy milk" },
  { id: 2, title: "Finish homework" },
];

async function getItems()
{
  const result = await db.query("SELECT * FROM items");
  items = result.rows;
 return items;
}

app.get("/", async (req, res) => {
  const items =  await getItems();
  res.render("index.ejs", {
    listTitle: "Today",
    listItems: items,
  });
});

app.post("/add", async (req, res) => {
  const item = req.body.newItem;
 // items.push({ title: item });
 try{
 await db.query("INSERT INTO items (title) VALUES ($1)",[item]);
  res.redirect("/");
 }catch(err)
 {
  console.log(err);
 }
});

app.post("/edit", async (req, res) => {
  const id = req.body.updatedItemId;
  const title = req.body.updatedItemTitle;
  try{
  await db.query("UPDATE items SET title = $1 WHERE ID = $2",[title,id]);
    res.redirect("/");
  }catch(err)
  {
    console.log(err);
  }

});

app.post("/delete", async (req, res) => {
  const id = req.body.deleteItemId;
  try{
  await db.query("DELETE FROM items WHERE id = $1",[id]);
  res.redirect("/");
  }catch(err)
  {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
