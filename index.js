import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

// Database setup
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "book_tracker",
  password: "riyaz",
  port: 5432,
});
db.connect();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");


// ROUTES

// Home route - Show all books
app.get("/", async (req, res) => {
  const result = await db.query("SELECT * FROM books ORDER BY date_read DESC");
  res.render("index", { books: result.rows });
});

// Add new book (Form Page)
app.get("/add", (req, res) => {
  res.render("add");
});

// Handle form submission
app.post("/add", async (req, res) => {
  const { title, author, rating, notes, date_read } = req.body;

  let coverUrl = `https://covers.openlibrary.org/b/title/${encodeURIComponent(title)}-M.jpg`;

  try {
    // Check if the image actually exists
    const response = await axios.get(coverUrl, { responseType: "arraybuffer" });
    const contentType = response.headers["content-type"];

    // If it's not a JPEG, then Open Library returned a default icon
    if (!contentType.includes("jpeg")) {
      coverUrl = "/images/default-cover.jpg";
    }
  } catch (error) {
    coverUrl = "/images/default-cover.jpg";
  }

  await db.query(
    "INSERT INTO books (title, author, rating, notes, date_read, cover_url) VALUES ($1, $2, $3, $4, $5, $6)",
    [title, author, rating, notes, date_read, coverUrl]
  );

  res.redirect("/");
});

app.get("/edit/:id", async (req, res) => {
  const id = req.params.id;
  const result = await db.query("SELECT * FROM books WHERE id = $1", [id]);
  res.render("edit", { book: result.rows[0] });
});

// Handle edit form submission
app.post("/edit/:id", async (req, res) => {
  const id = req.params.id;
  const { title, author, rating, notes, date_read } = req.body;

  // Update cover if title changed
  let coverUrl = `https://covers.openlibrary.org/b/title/${encodeURIComponent(title)}-M.jpg`;
  try {
    const response = await axios.get(coverUrl, { responseType: "arraybuffer" });
    if (!response.headers["content-type"].includes("jpeg")) {
      coverUrl = "/images/default-cover.jpg";
    }
  } catch {
    coverUrl = "/images/default-cover.jpg";
  }

  await db.query(
    "UPDATE books SET title=$1, author=$2, rating=$3, notes=$4, date_read=$5, cover_url=$6 WHERE id=$7",
    [title, author, rating, notes, date_read, coverUrl, id]
  );

  res.redirect("/");
});


// Delete a book
app.post("/delete/:id", async (req, res) => {
  const id = req.params.id;
  await db.query("DELETE FROM books WHERE id = $1", [id]);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});