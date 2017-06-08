var express = require("express");
var randomString = require('random-string');
var validator = require('validator');
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

function generateRandomString() {
  const urlLength = 6;

  return randomString({length: urlLength});
};

function getUserInfo(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
};

function isUserLoggedIn(req) {
  if (req.cookies.userID) {
    return true;
  } else {
    return false;
  }
};

function isEmailInUse(email) {
  if(getUserInfo(email)) {
    return true;
  } else {
    return false;
  }
};

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser')
app.use(cookieParser());

app.use(express.static('public'));

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

let users = {
  "b24x": {
    id: "b24x",
    email: "b24@gmail.com",
    password: "purple-monkey-dinosaur"
  },
  "B5x22": {
    id: "B5x22",
    email: "sean.s.fitz@gmail.com",
    password: "sean"
  }
};

app.get("/", (req, res) => {
  let templateVars = {
    user: req.cookies.userID ? users[req.cookies.userID] : ''
  };
  res.render("home", templateVars);
});

app.get("/urls", (req, res) => {
  if (!isUserLoggedIn(req)) {
    res.status(302);
    res.redirect('/');
    return;
  }
  let templateVars = {
    urls: urlDatabase,
    user: req.cookies.userID ? users[req.cookies.userID] : ''
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!isUserLoggedIn(req)) {
    res.status(302);
    res.redirect('/');
    return;
  };
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: req.cookies.userID ? users[req.cookies.userID] : ''
  };
  res.render("urls_show", templateVars);
});

app.get("/new", (req, res) => {
  if (!isUserLoggedIn(req)) {
    res.status(302);
    res.redirect('/');
    return;
  };
  let templateVars = {
    user: req.cookies.userID ? users[req.cookies.userID] : ''
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
    let templateVars = {
    user: req.cookies.userID ? users[req.cookies.userID] : ''
  };
  res.render("register", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  console.log(urlDatabase);
  delete urlDatabase[req.params.shortURL];
  console.log(urlDatabase);
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/login", (req, res) => {
  let userInfo = getUserInfo(req.body.email);
  if (!userInfo) {
    res.status(403);
    res.redirect('/');
    return;
  }
  if (userInfo.password !== req.body.password) {
    res.status(403);
    res.redirect('/');
    return;
  }
  res.cookie('userID', userInfo.id);
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  res.clearCookie('userID');
  res.redirect(`/`);
});

app.post("/register", (req, res) => {
  if (!validator.isEmail(req.body.email) || req.body.password === '' || isEmailInUse(req.body.email)) {
    res.status(400);
    res.redirect('/register');
    return;
  };

  let newID = generateRandomString();
  users[newID] = {
    id: newID,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie('userID', newID);
  console.log(users);
  console.log(res.cookie);
  res.redirect(`/urls`);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});