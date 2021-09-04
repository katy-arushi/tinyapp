const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// function to generate new shortURLs
function generateRandomString() {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) { // set random string to 6 chars long
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// object to store all urls
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// object to store users
let users = {};

app.listen(PORT, () => {
  console.log(`TinyApp server running on PORT ${PORT}!`);
});


// HTTP ROUTES

// GET REQUESTS

// GET home page
app.get("/", (req, res) => {
  res.send("<html><h1>Hello! Welcome to the TinyApp URL Shortening Service!</h1></html>");
});

// GET all URLs stored in database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// GET register page
app.get("/register", (req, res) => {
  res.render("register");
});

// GET all URLs that have been shortened, in database obj
app.get("/urls", (req, res) => {
  const user = users[req.cookies['user_id']]
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  res.render("urls_index", templateVars);
});

// GET input form to submit a new URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// GET page for a shortened URL
app.get("/urls/:shortURL", (req, res) => {
  //const user = users[req.cookies[user_id]]
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies['user_id']]
  };
  res.render("urls_show", templateVars);
});

// GET redirect short URLs to long URLs
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("Error, please check your shortened URL");
  }
  res.redirect(longURL);
});


// POST REQUESTS

// POST form to add URL - post data and redirect to URLs home
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

// POST request to login
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// POST request to logout
app.post("/logout", (req, res) => {
  res.clearCookie('username', req.body.username);
  res.redirect('/urls');
});

// POST request to submit registration form
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password
  users[id] = {
    id,
    email,
    password
  };
  res.cookie('user_id', id);
  console.log(users)
  res.redirect('/urls');
});

// POST request to edit URL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});

// POST request to delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

users = {
  zG7FH9: { 
    id: 'zG7FH9', 
    email: 'katy@gmail.com', 
    password: 'tinyapp!' 
  }
}