import express from "express";
import pg from "pg";
import dotenv from "dotenv";
const PORT = 3000;

dotenv.config();
const app = express();
const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
});

app.use(express.json());
// app.get("/", (req, res) => {
//   res.send("Welcome to this NodeJS and PostgreSQL lesson.");
// });

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM players");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/players", async (req, res) => {
  const { name, join_date } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO players (name, join_date) VALUES ($1, $2) RETURNING *",
      [name, join_date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put("/players/:player_id", async (req, res) => {
  const { player_id } = req.params;     //gets the id of the player to update
  const { name, join_date } = req.body; //gets the new details from the request
  try {
    const result = await pool.query(
      "UPDATE players SET name = $1, join_date = $2 WHERE player_id = $3 RETURNING *",
      [name, join_date, player_id]  //replace placeholders with the new values and the id
    );
    if (result.rows.length === 0) {
      return res.status(404).send("player not found");  //no player with that id
    }
    res.json(result.rows[0]);   //send back the updated player
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.delete("/players/:player_id", async (req, res) => {
  const { player_id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM players WHERE player_id = $1 RETURNING *",
      [player_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send("player not found");
    }
    res.send("player deleted successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//Task 1: List All Players and Their Scores
app.get("/players-scores", async (req, res) => {
  try {
    const result = await pool.query("SELECT p.name AS player_name, g.title AS game_title, s.scores FROM scores s INNER JOIN players p ON s.player_id = p.player_id INNER JOIN games g ON s.game_id = g.game_id;");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//Task 2: Find High Scorers
app.get("/top-players", async (req, res) => {
  try {
    const result = await pool.query("SELECT p.name AS player_name, SUM(s.scores) AS total_scores FROM players p INNER JOIN scores s ON p.player_id = s.player_id GROUP BY p.player_id, p.name ORDER BY total_scores DESC LIMIT 3");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//Task 3: Players Who Didn’t Play Any Games
app.get("/inactive-players", async (req, res) => {
  try {
    const result = await pool.query("SELECT p.name AS player_name FROM players p LEFT JOIN scores s ON p.player_id = s.player_id WHERE s.player_id IS NULL");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//Task 4: Find Popular Game Genres
app.get("/popular-genres", async (req, res) => {
  try {
    const result = await pool.query("SELECT g.genre, COUNT(*) AS plays_count FROM scores s INNER JOIN games g ON s.game_id = g.game_id GROUP BY g.genre ORDER BY plays_count DESC LIMIT 1");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//Task 5: Recently Joined Players
app.get("/recent-players", async (req, res) => {
  try {
    const result = await pool.query("SELECT player_id, name, join_date FROM players WHERE join_date >= CURRENT_DATE - INTERVAL '30 days' ORDER BY join_date DESC");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(3000, (req, res) => {
  console.log(`Server is running on PORT ${PORT}`);
});