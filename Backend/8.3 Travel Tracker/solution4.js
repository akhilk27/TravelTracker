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

// let users = [
//   { id: 1, name: "Akhilesh", color: "teal" },
//   { id: 2, name: "Sreeram", color: "powderblue" },
// ];

let users;

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
  // console.log(input);

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


// route for deleting a state
app.post("/delete-state", async (req, res) => {
  const input = req.body["state"];
  const currentUser = await getCurrentUser();
  // console.log(input);

  try {
    const result = await db.query(
      "SELECT state_code FROM states WHERE LOWER(state_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );
    // console.log(result);
    if (result.rows.length > 0) {
      const data = result.rows[0];
      const stateCode = data.state_code;

      try {
        await db.query("DELETE FROM visited_states_grp WHERE state_code = $1 AND user_id = $2", 
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
  } catch{
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

// Add new user
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


// Delete a user
app.post("/delete-user", async (req, res) => {
  const name = req.body.name;
  console.log("Name received:", name);

  try {
    // First, get the user ID
    const userResult = await db.query("SELECT id FROM users WHERE name = $1", [name]);
    console.log("User result:", userResult);
    if (userResult.rows.length === 0) {
      // If no user with the given name was found
      console.log("User not found")
      return res.redirect("/");  // Redirect to homepage if user not found
    }

    const userId = userResult.rows[0].id;
    console.log("userId:", userId);

    // Delete user's entries from visited_states_grp
    await db.query("DELETE FROM visited_states_grp WHERE user_id = $1", [userId]);
    
    // Then delete the user
    const result = await db.query("DELETE FROM users WHERE id = $1", [userId]);
    console.log("result:", result)
    console.log("User deleted")
    return res.redirect("/");  // Redirect to homepage after deletion
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send({ success: false, message: "An error occurred while deleting user" });
  }
});






app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
