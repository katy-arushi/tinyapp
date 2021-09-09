// -------------------- DEPENDENCIES -------------------- //
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');

// -------------------- MIDDLEWARE -------------------- //
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);

//  ------------------------ PORT ---------------------- //
const PORT = 8080;
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
      if (bcrypt.compareSync(password, users[user].password)) { 
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

// -------------------- DATABASE OBJECTS -------------------- //

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
  }
};

// -------------------------- GET ROUTE HANDLERS ---------------------------- //

// GET home page - display welcome message
app.get("/", (req, res) => {
  const templateVars = {
    user: null,
    welcomeMessage: "Welcome to TinyApp! Please register or login to begin using TinyApp."
  }
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

// GET logout page
app.get("/logout", (req, res) => {
  res.redirect("/login");
});

// GET all URLs that have been shortened, in database obj
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    const templateVars = {
      user: null,
      error: "Sorry, you are not permitted to view this page"
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
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
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
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!userID) {
    const templateVars = {
      user: null,
      error: "Sorry, this URL is not registered to your account."
    };
    res.status(403).render("error", templateVars);
  } else if (userID === urlDatabase[shortURL].userID) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      userID: req.session.user_id,
      user: users[req.session.user_id]
    };
    res.render("urls_show", templateVars);
  } else {
    const templateVars = {
      user: null,
      error: "Sorry, you are not permitted to view, edit, or delete this URL."
    };
    res.status(403).render("error", templateVars);
  }
});

// GET redirect short URLs to long URLs
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (!urlDatabase[req.params.shortURL]) {
    const templateVars = {
      user: null,
      error: "Error, this short URL does not exist."
    };
    return res.status(404).render("error", templateVars);
  }
  res.redirect(longURL);
});


// -------------------- POST ROUTE HANDLERS -------------------- //

// POST form to add URL - post data and redirect to URLs home
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {longURL: longURL, userID: req.session.user_id};
  res.redirect(`/urls/${shortURL}`);
});

// POST request to login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password; // password that is entered to the login form
  const user = findUser(email, password);
  if (user) {
    req.session.user_id = user.id;
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: null,
      error: "Error, login failed. Make sure your email and password are correct."
    }
    res.status(403).render("error", templateVars);
  }
});

// POST request to logout
app.post("/logout", (req, res) => {
  res.session = null;
  res.redirect('/urls');
});

// POST request to submit registration form
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (email === '' || password === '') {
    const templateVars = {
      user: null,
      error: "Error, email or password cannot be empty"
    }
    return res.status(400).render("error", templateVars);
  }
  for (const user in users) {
    if (users[user].email === email) {
      const templateVars = {
        user: null,
        error: "Error, this email has already been registered"
      }
      return res.status(400).render("error", templateVars);
    }
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
      user: null,
      error: "Sorry, you are not permitted to view, edit, or delete this URL."
    };
    res.status(403).render("error", templateVars);
  }
});

// POST request to delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  if ((urlDatabase[shortURL].userID) === userID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: null,
      error: "Sorry, you are not permitted to view, edit, or delete this URL."
    };
    res.status(403).render("error", templateVars);
  }
});