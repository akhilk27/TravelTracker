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
db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected');
  }
});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Akhilesh", color: "teal" },
  { id: 2, name: "Sreeram", color: "powderblue" },
];

async function checkVisited() {
  try {
    const result = await db.query("SELECT state_code FROM visited_states_grp JOIN users ON users.id = user_id WHERE user_id = $1;", [currentUserId]);
    let states = [];
    result.rows.forEach((state) => {
      states.push(state.state_code);
    });
    return states;
  } catch (err) {
    console.error('Error fetching visited states:', err);
    return [];
  }
}


async function getCurrentUser() {
  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  return users.find((user) => user.id == currentUserId);
}

// GET home page
app.get("/", async (req, res) => {
  const states = await checkVisited();
  const currentUser = await getCurrentUser();
  res.render("index2.ejs", { 
    states: states,
    total: states.length,
    users: users,
    color: currentUser.color, });
});

//INSERT new state
app.post("/add", async (req, res) => {
  const input = req.body["state"];
  const currentUser = await getCurrentUser();

  try {
    const result = await db.query(
      "SELECT state_code FROM states WHERE LOWER(state_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    if (result.rows.length > 0) {
      const data = result.rows[0];
      const stateCode = data.state_code;

      try {
        await db.query("INSERT INTO visited_states_grp (state_code, user_id) VALUES ($1, $2)",
          [stateCode, currentUserId]
        );
        res.redirect("/");
      } catch (err) {
        console.log(err);
        const states = await checkVisited();
        res.render("index2.ejs", {
          states: states,
          total: states.length,
          error: "This State has already been added, try again.",
        });
      }
    } else {
      console.log("State not found. Redirecting to home page.");
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
    const states = await checkVisited();
    res.render("index2.ejs", {
      states: states,
      total: states.length,
      error: "An error occurred. Please try again.",
    });
  }
});


app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;

  const result = await db.query(
    "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
    [name, color]
  );

  const id = result.rows[0].id;
  currentUserId = id;

  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
