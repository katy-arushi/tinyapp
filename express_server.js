// ------------------------------ DEPENDENCIES -------------------------------- //
const express = require('express');
const app = express();
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers");

// -------------------------------- MIDDLEWARE -------------------------------- //
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);

//  --------------------------------- PORT --------------------------------- //
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`TinyApp server running on PORT ${PORT}!`);
});

// ----------------------------- DATABASE OBJECTS --------------------------- //

// Database object to store all urls
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "M7yu0z"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
  cYpEMJ: {
    longURL: "https://www.cbc.ca/news",
    userID: "aJ48lW"
  }
};

// Database object to store users
let users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "arushi@email.com",
    password: "$2b$10$MMcQpI/ACDWru7PFg0.zU.3tIkhnqswR0harhFXKktqvPYwoObk0m" //password is 1234
  }
};

// -------------------------------------- GET ROUTE HANDLERS -------------------------------------- //

// GET home page - display welcome message
app.get("/", (req, res) => {
  req.session = null;
  const templateVars = {
    user: null,
    welcomeMessage1: "Welcome to TinyApp!",
    welcomeMessage2: "Please register or login to begin using TinyApp."
  };
  res.render("home", templateVars);
});

// show all URLs stored in database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// show all users stored in database
app.get("/users.json", (req, res) => {
  res.json(users);
});

// GET register page
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("register", templateVars);
});

// GET login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("login", templateVars);
});


// GET all URLs that have been shortened, in database obj
// ERROR if no user is logged in
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    const templateVars = {
      user: null,
      error: "Sorry, to view this page you must register or login."
    };
    res.status(403).render("error", templateVars);
  } else {
    const userSpecificDatabase = urlsForUser(userID, urlDatabase);
    const templateVars = {
      urls: userSpecificDatabase,
      userID: req.session.user_id,
      user: users[userID]
    };
    res.render("urls_index", templateVars);
  }
});

// GET input form to submit a new URL
// REDIRECT to login page if no user is logged in (check cookie to determine login status)
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    const templateVars = {
      user: null,
      error: "Sorry, you must register or login to create new tiny URLs."
    };
    res.status(401).render("error", templateVars);
  } else {
    const templateVars = {
      userID: req.session.user_id,
      user: users[userID]
    };
    res.render("urls_new", templateVars);
  }
});

// GET page for a shortened URL
// ERROR if no user is logged in
// ERROR if user tries to view a URL that is not linked to their userID
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!urlDatabase[req.params.shortURL]) {
    const templateVars = {
      user: users[req.session.user_id],
      error: "Error, this tiny URL does not exist."
    };
    res.status(404).render("error", templateVars);
  }
  if (!userID) { // if no user is logged in
    const templateVars = {
      user: null,
      error: "Sorry, you must login to view this URL."
    };
    res.status(401).render("error", templateVars);
  } else if (userID === urlDatabase[shortURL].userID) { // if URL belongs to the current user (checked via cookie)
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      userID: req.session.user_id,
      user: users[req.session.user_id]
    };
    res.render("urls_show", templateVars);
  } else {
    const templateVars = {
      user: users[req.session.user_id],
      error: "Sorry, you are not permitted to view, edit, or delete this URL."
    };
    res.status(403).render("error", templateVars);
  }
});

// GET redirect short URLs to long URLs
// ERROR if no short URL exists
// REDIRECT to long url
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (!urlDatabase[req.params.shortURL]) {
    const templateVars = {
      user: users[req.session.user_id],
      error: "Error, this tiny URL does not exist."
    };
    return res.status(404).render("error", templateVars);
  }
  res.redirect(longURL);
});


// ------------------------------------ POST ROUTE HANDLERS --------------------------------------- //

// POST form to add URL - post data
// REDIRECT to short URL page
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.redirect("/login");
  }
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {longURL: longURL, userID: req.session.user_id};
  res.redirect(`/urls/${shortURL}`);
});

// POST request to login
// ERROR if email or password are left empty
// ERROR if user is not found by getUserByEmail function
// ERROR if user is found, but password is incorrect
// REDIRECT to urls page
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password; // password that is entered to the login form
  const user = getUserByEmail(email, users);
  if (!email || !password) {
    const templateVars = {
      user: users[req.session.user_id],
      error: "Error, login failed. You have left a required field for login empty."
    };
    res.status(401).render("error", templateVars);
  }
  if (user) { // happy path. when user exists.
    if (bcrypt.compareSync(password, users[user].password)) { // even happier path. when password is correct. login in the user!
      req.session.user_id = user.id;
      res.redirect('/urls');
    } else { // case where user exists, but password is incorrect.
      const templateVars = {
        user: users[req.session.user_id],
        error: "Error, login failed. Password is incorrect."
      };
      res.status(401).render("error", templateVars);
    }
  } else if (!user) { // case where no user is found
    const templateVars = {
      user: users[req.session.user_id],
      error: "Error, login failed. No account exists."
    };
    res.status(401).render("error", templateVars);
  }
});

// POST request to logout
// REDIRECT to login page
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/');
});

// POST request to submit registration form\
// ERROR if password or email field are left empty when registering
// ERROR if user tries to register with an email that has already been registered
// REDIRECT to urls page
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (!email || !password) {
    const templateVars = {
      user: null,
      error: "Error, email or password cannot be left empty."
    };
    return res.status(400).render("error", templateVars);
  }

  // check to see if a user is found
  if (getUserByEmail(email, users)) {
    const templateVars = {
      user: null,
      error: "Error, this email has already been registered."
    };
    return res.status(400).render("error", templateVars);
  }

  users[id] = {
    id,
    email,
    password: hashedPassword
  };
  req.session.user_id = id; // setting cookie
  res.redirect('/urls');
});

// POST request to edit URL
// ERROR if user tries to edit a URL that is not linked to their userID
// REDIRECT to urls page
app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const userID = req.session.user_id;
  // check if short URL belongs to the user (by checking userID)
  if ((urlDatabase[shortURL].userID) === userID) {
    urlDatabase[shortURL] = {longURL: longURL, userID: req.session.user_id};
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.session.user_id],
      error: "Sorry, you are not permitted to view, edit, or delete this URL."
    };
    res.status(403).render("error", templateVars);
  }
});

// POST request to delete a URL
// ERROR if user tries to edit a URL that is not linked to their userID
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  if ((urlDatabase[shortURL].userID) === userID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.session.user_id],
      error: "Sorry, you are not permitted to view, edit, or delete this URL."
    };
    res.status(403).render("error", templateVars);
  }
});