const express = require("express");
const randomString = require('random-string');
const validator = require('validator');
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

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

function belongsToUser(user, shortURL) {
  if (urlDatabase[shortURL].userID === user) {
    return true;
  } else {
    return false;
  }
};

function usersURLs (user) {
  let filteredURLs = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === user) {
      filteredURLs[url] = urlDatabase[url];
    }
  }
  return filteredURLs;
};


function makeValidURL (url) {
  if ((url.slice(0,7) !== "https://") || (url.slice(0,6) !== "http://"))  {
    url = "https://" + url;
  }
  return url;
};

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser')
app.use(cookieParser());

app.use(express.static('public'));

let urlDatabase = {
  "1EB7Si": { longURL: 'https://www.lighthouselabs.com', userID: '32ysdZ' },
  "95Pm9F": { longURL: 'https://www.test.com', userID: '32ysdZ' },
  "vm5GQQ": { longURL: 'https://www.facebook.com', userID: '32ysdZ' },
  "VbZydz": { longURL: 'https://www.reddit.com', userID: 'QbiDb4' },
  "bBUm9b": { longURL: 'https://www.instagram.com', userID: 'QbiDb4' },
  "r5FMC0":
   { longURL: 'https://github.com/SeanSFitz/tiny-app',
     userID: 'QbiDb4' },
  "KTaRgu": { longURL: 'https://www.wikipedia.org', userID: 'QbiDb4' },
  "XDYgdD": { longURL: 'https://www.snapchat.com', userID: 'DU8ks8' }
};

let users = {
  "DU8ks8":
   { id: 'DU8ks8',
     email: 'fitzpatrick_ss@yahoo.ca',
     password: '$2a$10$2RznB09XBn67PIh36B39J.gDw8u5leoHv0bU5gwXsKhhwOvZBZKMa'
   },
  "QbiDb4":
   { id: 'QbiDb4',
     email: 'sean.s.fitz@gmail.com',
     password: '$2a$10$u1metLKK6PlqoLTODbyaBuIvlPNi9ehZ8u9VxWS3MsIFpWmHe0ppu'
   },
  "32ysdZ":
   { id: '32ysdZ',
     email: 'test@test.com',
     password: '$2a$10$nDD2sTMN.o8eODSOuImlSe366fE9MYfH/lXkKWdcOWoGduzaoHrp6'
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
    urls: usersURLs(req.cookies.userID),
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
  if (!belongsToUser(req.cookies.userID, req.params.id)) {
    res.status(400).send("This link doesn't belong to you!");
    return;
  };

  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
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
  urlDatabase[shortURL] = {
    longURL: makeValidURL(req.body.longURL),
    userID: req.cookies.userID
  };
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!belongsToUser(req.cookies.userID, req.params.shortURL)) {
    res.status(400);
    res.redirect(`/urls`);
    return;
  };
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL", (req, res) => {
  if (!belongsToUser(req.cookies.userID, req.params.shortURL)) {
    res.status(400);
    res.redirect(`/urls/${req.params.shortURL}`);
    return;
  };
  urlDatabase[req.params.shortURL].longURL = makeValidURL(req.body.longURL);
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/login", (req, res) => {
  let userInfo = getUserInfo(req.body.email);
  if (!userInfo) {
    res.status(403);
    res.redirect('/');
    return;
  }
  if (!bcrypt.compareSync(req.body.password, userInfo.password)) {
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
    password: bcrypt.hashSync(req.body.password, 10)
  };
  res.cookie('userID', newID);
  console.log(users);
  console.log(res.cookie);
  res.redirect(`/urls`);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});