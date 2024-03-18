import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Akhilesh@27",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisisted() {
  const result = await db.query("SELECT state_code FROM visited_states");

  let states = [];
  result.rows.forEach((state) => {
    states.push(state.state_code);
  });
  return states;
}

// GET home page
app.get("/", async (req, res) => {
  const states = await checkVisisted();
  res.render("index3.ejs", { states: states, total: states.length });
});

//INSERT new state
app.post("/add", async (req, res) => {
  const input = req.body["state"];

  try{
    const result = await db.query(
      "SELECT state_code FROM states WHERE LOWER(state_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );
    console.log(result)
      const data = result.rows[0];
      const stateCode = data.state_code;
  
      try{
        await db.query("INSERT INTO visited_states (state_name, state_code) VALUES ($1,$2)", [
          input, stateCode,
        ]);
        res.redirect("/");
      } catch(err){
        console.log(err);
        const states = await checkVisisted();
        res.render("index3.ejs", {
          states: states,
          total: states.length,
          error: "This State has already been added, try again.",
        });
      }
  } catch(err){
    console.log(err);
    const states = await checkVisisted();
    res.render("index3.ejs", {
      states: states,
      total: states.length,
      error: "State name does not exist, try again.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
