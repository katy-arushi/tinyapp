const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.listen(PORT, () => {
  console.log(`TinyApp server running on PORT ${PORT}!`);
});


// HELPER FUNCTIONS
// function to generate new shortURLs
const generateRandomString = function() {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) { // set random string to 6 chars long
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// function to determine if user login is valid (if user is registered and password is correct)
const findUser = function(email, password) {
  for (const user in users) {
    if (users[user].email === email) {
      if (users[user].password === password) {
        return users[user]; // returns user object
      }
    }
  }
  return false; // case where email and password don't match or email doesn't exist
}

// function to find all the user's shortURLs
const urlsForUser = function(id, databaseObject) {
  let userSpecificDatabase = {};  // only show the urls for the logged in user
  for (const shortURL in databaseObject) {
    if (id === databaseObject[shortURL].userID) {
      userSpecificDatabase[shortURL] = databaseObject[shortURL]
    }
  }
  return userSpecificDatabase;
}

// Database object to store all urls
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
  cYpEMJ: {
    longURL: "https://www.cbc.ca/news",
    userID: "M7yu0z"
  }
};

// Database object to store users
let users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "arushi@email",
    password: "1234"
  },
  "B6789": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};


// GET REQUESTS

// GET home page
app.get("/", (req, res) => {
  res.send("<html><h1>Hello! Welcome to the TinyApp URL Shortening Service!</h1></html>");
});

// show all URLs stored in database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// GET register page
app.get("/register", (req, res) => {
  const templateVars = {
    userID: req.cookies["user_id"],
    user: users[req.cookies['user_id']]
  };
  res.render("register", templateVars);
});

// GET login page
app.get("/login", (req, res) => {
  const templateVars = {
    userID: null,
    user: users[req.cookies['user_id']]
  };
  res.render("login", templateVars);
});

// GET logout page
app.get("/logout", (req, res) => {
  res.redirect("/login");
});

// GET all URLs that have been shortened, in database obj
app.get("/urls", (req, res) => {
  const userID = req.cookies['user_id'];
  if (!userID) {
    const templateVars = {
      user: null
    };
    res.render("login_register_prompt", templateVars); // create page that redirects to login or register page
  } else {
    let userSpecificDatabase = urlsForUser(userID, urlDatabase);
    const templateVars = {
      urls: userSpecificDatabase,
      userID: req.cookies['user_id'],
      user: users[userID]
    };
    res.render("urls_index", templateVars);
  }
});

// GET input form to submit a new URL
app.get("/urls/new", (req, res) => {
  const userID = req.cookies['user_id'];
  if (!userID) {
    res.redirect("/login");
  } else {
    const templateVars = {
      user: users[userID]
    };
    res.render("urls_new", templateVars);
  }
});

// GET page for a shortened URL
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies['user_id'];
  if (!userID) {
    const templateVars = {
      user: null
    };
    res.render("login_register_prompt", templateVars);
  } else {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.cookies['user_id']],
      userID: req.cookies["user_id"]
    };
    res.render("urls_show", templateVars);
  }
});

// GET redirect short URLs to long URLs
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
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
  const email = req.body.email;
  const password = req.body.password; // password that is entered to the login form
  const user = findUser(email, password);
  if (user) {
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  } else {
    res.status(403).send("Error, login failed");
  }
});

// POST request to logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// POST request to submit registration form
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  if (email === '' || password === '') {
    return res.status(400).send("Error, email or password cannot be empty");
  }
  for (const user in users) {
    if (users[user].email === email) {
      return res.status(400).send("Error, this email has already been registered");
    }
  }
  users[id] = {
    id,
    email,
    password
  };
  res.cookie('user_id', id);
  console.log(users);
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