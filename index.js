const express = require('express');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();
const bodyParser = require('body-parser');
const { ok } = require('assert');
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const app = express();
const port = process.env.PORT || 8000;
const database_url = process.env.DATABASE_URL;

var database, courses, users;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.listen(port, () => {
  console.log(database_url);
  MongoClient.connect(database_url, { useNewUrlParser: true }, (error, client) => {
    if (error) {
      throw error;
    }
    database = client.db("VRSCHOOL7");
    courses = database.collection("Courses");
    users = database.collection("Users");
    console.log("Connected to `VRSCHOOL7`!");
  });
});

app.get('/', (req, res) => {

});

app.get('/api/login', (req, res) => {

  var username = req.query.username;
  var password = req.query.password;
  var result;
  users.findOne({ "name": username, "password": password }, (error, query) => {
    if (error) {
      return res.status(500).send(error);
    }
    if (query == null) {
      result = { status: "ERROR", message: "User not found", session_token: "" };
    } else {
      var token = get_token(query);
      result = { status: "OK", message: "Correct authentication", session_token: token }
    }
    res.send(result);
  });
});

app.get('/api/logout', (req, res) => {
  var token = req.query.session_token, result;
  users.findOne({ "token": token }, (error, query) => {
    if (error) {
      return res.status(500).send(error);
    }
    if (query == null) {
      result = { status: "ERROR", message: "Session_token is required"};
    } else {
      result = { status: "OK", message: "Session successfully closed"}
    }
    res.send(result);
  });
});

app.get('/api/get_course', (req, res) => {
  var token = req.query.session_token, result;
  users.findOne({ "token": token }, (error, user) => {
    if (error) {
      return res.status(500).send(error);
    }
    if (user == null) {
      res.send({ status: "ERROR", message: "session_token is required" });
    } else {
      if (Date.now() < user.expiration_time.getTime()) {
        courses.find({ $or: [{ "subscribers.students": user.id }, { "subscribers.teachers": user.id }] }).project({ "title": 1, "description": 1 }).toArray((error, course_list) => {
          if (error) {
            return res.status(500).send(error);
          }
          res.send({ status: "OK", message: "Correct authentication", course_list: course_list });
        });
      } else {
        res.send({ status: "ERROR", message: "Token expired" });
      }
    }
  });
});

app.get('/api/get_course_details', (req, res) => {
  var token = req.query.session_token, courseID = req.query.courseID;
  var result;
  users.findOne({ "token": token }, (error, user) => {
    if (error) {
      return res.status(500).send(error);
    }
    if (user == null) {
      res.send({ status: "ERROR", message: "session_token is required" });
    } else {
      if (Date.now() < user.expiration_time.getTime()) {
        courses.findOne({ $and: [{ $or: [{ "subscribers.students": user.id }, { "subscribers.teachers": user.id }] }, { "_id": ObjectId(courseID) }] }, function (error, course) {
          if (error) {
            return res.status(500).send(error);
          }
          if (course == null) {
            res.send({ status: "ERROR", message: "Insufficient permissions" });
          } else {
            res.send({ status: "OK", message: "Correct authentication", course: course });
          }
        });
      } else {
        res.send({ status: "ERROR", message: "Token expired" });
      }
    }
  });
});

function get_token(user) {
  if (user.token != '') {
    if (Date.now() < user.expiration_time.getTime()) {
      return user.token;
    }
  }
  var random = Math.floor(Math.random() * 1000);
  var new_token = crypto.createHash('md5').update(user.name + user.password + random).digest('hex');
  var expiration_time = new Date(parseInt(Date.now()) + parseInt(process.env.TOKEN_EXPIRATION_TIME));
  var newvalues = { $set: { token: new_token, expiration_time: expiration_time } };
  users.updateOne(user, newvalues, function (err, res) {
    if (err) throw err;
  });
  return new_token;
}