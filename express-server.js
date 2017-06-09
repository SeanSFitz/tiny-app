const express = require("express");
const methodOverride = require('method-override')
const randomString = require('random-string');
const validator = require('validator');
const bcrypt = require('bcrypt');
const moment = require('moment-timezone');
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
  if (req.session.userID) {
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

const validURL = /^https?:\/\//;

function makeValidURL (url) {
  if (!validURL.test(url))  {
    url = "http://" + url;
  }
  return url;
};

function isUniqueVisitor(visitor, shortURL) {
  if (urlDatabase[shortURL].visitors.indexOf(visitor) >= 0) {
    return false;
  } else {
    return true;
  }
};

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  secret: 'sean'
}));

app.use(methodOverride('_method'))
app.use(express.static('public'));

let urlDatabase = {
  "1EB7Si": { longURL: 'https://www.lighthouselabs.com', userID: '32ysdZ', visits: [], visitors: [] },
  "95Pm9F": { longURL: 'https://www.test.com', userID: '32ysdZ', visits: [], visitors: [] },
  "vm5GQQ": { longURL: 'https://www.facebook.com', userID: '32ysdZ', visits: [], visitors: [] },
  "VbZydz": { longURL: 'https://www.reddit.com', userID: 'QbiDb4', visits: [], visitors: [] },
  "bBUm9b": { longURL: 'https://www.instagram.com', userID: 'QbiDb4', visits: [], visitors: [] },
  "r5FMC0":
   { longURL: 'https://github.com/SeanSFitz/tiny-app',
     userID: 'QbiDb4', visits: [], visitors: [] },
  "KTaRgu": { longURL: 'https://www.wikipedia.org', userID: 'QbiDb4', visits: [], visitors: [] },
  "XDYgdD": { longURL: 'https://www.snapchat.com', userID: 'DU8ks8', visits: [], visitors: [] }
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
    user: req.session.userID ? users[req.session.userID] : ''
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
    urls: usersURLs(req.session.userID),
    user: req.session.userID ? users[req.session.userID] : ''
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!isUserLoggedIn(req)) {
    res.status(302);
    res.redirect('/');
    return;
  };
  let templateVars = {
    user: req.session.userID ? users[req.session.userID] : ''
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!isUserLoggedIn(req)) {
    res.status(302);
    res.redirect('/');
    return;
  };
  if (!belongsToUser(req.session.userID, req.params.id)) {
    res.status(400).send("This link doesn't belong to you!");
    return;
  };

  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    visits: urlDatabase[req.params.id].visits,
    visitors: urlDatabase[req.params.id].visitors,
    user: req.session.userID ? users[req.session.userID] : ''
  };
  res.render("urls_show", templateVars);
});



app.get("/register", (req, res) => {
    let templateVars = {
    user: req.session.userID ? users[req.session.userID] : ''
  };
  res.render("register", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: makeValidURL(req.body.longURL),
    userID: req.session.userID
  };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  if (!req.session.visitorID) {
    req.session.visitorID = generateRandomString();
  }
  if (isUniqueVisitor(req.session.visitorID, req.params.shortURL)) {
    urlDatabase[req.params.shortURL].visitors.push(req.session.visitorID);
  }
  let time = moment.tz("America/Toronto").format('llll');
  urlDatabase[req.params.shortURL].visits.push({visitorID: req.session.visitorID, timestamp: time});
  res.redirect(longURL);
});

app.delete("/urls/:shortURL", (req, res) => {
  if (!belongsToUser(req.session.userID, req.params.shortURL)) {
    res.status(400);
    res.redirect(`/urls`);
    return;
  };
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

app.put("/urls/:shortURL", (req, res) => {
  if (!belongsToUser(req.session.userID, req.params.shortURL)) {
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
  req.session.userID = userInfo.id;
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  req.session.userID = null;
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
  req.session.userID = newID;
  res.redirect(`/urls`);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});