const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); 

function generateRandomString() { // generate random string for short URL
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) { // set random string to 6 chars long
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

//middleware - needed for POST requests
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));



// HTTP ROUTES

// object to store all urls
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// home page
app.get("/", (req, res) => {
  res.send("<html><h1>Hello! Welcome to the TinyApp URL Shortening Service!</h1></html>");
});

// display all URLs that have been shortened, in database obj
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// submit a new URL - get request for input form
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// submit form - post data and redirect
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/:${shortURL}`)
});

// post request to delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const url = req.params.shortURL
  delete urlDatabase[url]
  res.redirect("/urls")
});

// show page for a shortened URL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

// redirect short URLs to long URLs
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("Error, please check your shortened URL");
 }
res.redirect(longURL);
});

// show all URLs stored in database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`TinyApp server running on PORT ${PORT}!`);
});