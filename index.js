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

var database, courses, users, pins;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//create the variables for the database
app.listen(port, () => {
  console.log(database_url);
  MongoClient.connect(database_url, { useNewUrlParser: true }, (error, client) => {
    if (error) {
      throw error;
    }
    database = client.db("VRSCHOOL7");
    courses = database.collection("Courses");
    users = database.collection("Users");
    pins = database.collection("Pin");
    console.log("Connected to `VRSCHOOL7`!");
  });
});

app.get('/', (req, res) => {

});

//EndPoint for the login, gets name and password, validates and returns the token
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


//EndPoint for the close of the session, gets the token and validates it
app.get('/api/logout', (req, res) => {
  var token = req.query.session_token, result;
  users.findOne({ "token": token }, (error, query) => {
    if (error) {
      return res.status(500).send(error);
    }
    if (query == null) {
      result = { status: "ERROR", message: "Session_token is required" };
    } else {
      result = { status: "OK", message: "Session successfully closed" }
    }
    res.send(result);
  });
});


//EndPoint to the get all the corses that the user has access to
app.get('/api/get_course', (req, res) => {
  var token = req.query.session_token;
  users.findOne({ "token": token }, (error, user) => {
    if (error) {
      return res.status(500).send(error);
    }
    if (user == null) {
      res.send({ status: "ERROR", message: "session_token is required" });
    } else {
      if (Date.now() < user.expiration_time.getTime()) {
        courses.find({ $or: [{ "subscribers.students": user.id }, { "subscribers.teachers": user.id }] }).project({ "title": 1, "description": 1, "subscribers.teachers" : 1}).toArray((error, course_list) => {
          if (error) {
            return res.status(500).send(error);
          }
          res.send({ status: "OK", message: "Course list", course_list: course_list });
        });
      } else {
        result = { status: "ERROR", message: "Session_token has expired" };
        // var new_token = get_token(user);
        // res.send({ status: "OK", message: "Correct authentication", session_token: new_token });
      }
    }
  });
});

//EndPoint to get all the information about one course, also filters complete exercises per user
app.get('/api/get_course_details', (req, res) => {
  var token = req.query.session_token, courseID = req.query.courseID;
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
            for (let i = 0; i < course.vr_tasks.length; i++) {
              var completions_filtered = [];
              for (let j = 0; j < course.vr_tasks[i].completions.length; j++) {
                if (course.vr_tasks[i].completions[j].studentID == user.id) {
                  completions_filtered.push(course.vr_tasks[i].completions[j]);
                }
              }
              course.vr_tasks[i].completions = completions_filtered;
            }
            for (let i = 0; i < course.tasks.length; i++) {
              var uploads_filtered = [];
              for (let j = 0; j < course.tasks[i].uploads.length; j++) {
                if (course.tasks[i].uploads[j].studentID == user.id) {
                  uploads_filtered.push(course.tasks[i].uploads[j]);
                }
              }
              course.tasks[i].uploads = uploads_filtered;
            }
            res.send({ status: "OK", message: "Correct authentication", course: course });
          }
        });
      } else {
        result = { status: "ERROR", message: "Session_token has expired" };
        // var new_token = get_token(user);
        // res.send({ status: "OK", message: "Correct authentication", session_token: new_token });
      }
    }
  });
});

//EndPoint to get all the information about all the courses
app.get('/api/export_database', (req, res) => {
  var username = req.query.username;
  var password = req.query.password;
  users.findOne({ "name": username, "password": password }, (error, query) => {
    if (error) {
      return res.status(500).send(error);
    }
    if (query == null) {
      res.send({ status: "ERROR", message: "User not found" });
    } else {
      courses.find().toArray((error, course_list) => {
        if (error) {
          return res.status(500).send(error);
        }
        res.send({ status: "OK", message: "Correct authentication", course_list: course_list });
      });
    }
  });
});


//EndPoint to get the Pin for user to access the VR exercise
app.get('/api/pin_request',  (req, res) => {
  var token = req.query.session_token; 
  var VRtaskID = parseInt(req.query.VRtaskID);
  users.findOne({ "token": token }, (error, user) => {
    if (error) {
      return res.status(500).send(error);
    }
    if (user == null) {
      res.send({ status: "ERROR", message: "session_token is required" });
    } else {
      if (Date.now() < user.expiration_time.getTime()) {
        courses.findOne({ "vr_tasks.ID": VRtaskID }, (error, course) => {
          if (error) {
            return res.status(500).send(error);
          }
          if (course == null) {
            res.send({ status: "ERROR", message: "VRtaskID is required" });
          }else{
            get_pin(VRtaskID, user).then(val => { res.send({ status: "OK", message: "Correct authentication", PIN: val });});
          }
        });
      } else {
        res.send({ status: "ERROR", message: "Session_token has expired" });
        // var new_token = get_token(user);
        // res.send({ status: "OK", message: "Correct authentication", session_token: new_token });
      }
    }
  });
});

//EndPoint to get the information per pin
app.get('/api/start_vr_exercise',  (req, res) => {
  var pin = req.query.PIN; 
  pins.findOne({ "pin": pin }, (error, data) => {
    if (error) {
      return res.status(500).send(error);
    }
    if (data == null) {
      res.send({ status: "ERROR", message: "PIN is required" });
    } else {
      courses.findOne({ "vr_tasks.ID": data.VRtaskID },{projection: {"vr_tasks.$": true}}, (error, course) => {
        if (error) {
          return res.status(500).send(error);
        }
        if (course == null) {
          res.send({ status: "ERROR", message: "VRtask not found" });
        }else{
          res.send({ status: "OK", message: "Correct authentication", username : data.username, VRexerciseID: course.vr_tasks[0].VRexID });
        }
      });
    }
  });
});

//EndPoint to save the information about user result in database
app.post('/api/finish_vr_exercise',  (req, res) => {
  var pin = req.body.PIN; 
  var autograde = req.body.autograde; 
  var exerciseVersion = req.body.exerciseVersionID; 
  var VRexerciseID = req.body.VRexerciseID; 
  var performance_data = req.body.performance_data;
  autograde.failed_items = parseInt(autograde.failed_items);
  autograde.passed_items = parseInt(autograde.passed_items);
  autograde.score = parseInt(autograde.score);
  autograde.comments = autograde.comments;
  pins.findOne({ "pin": pin }, (error, data) => {
    if (error) {
      return res.status(500).send(error);
    }
    if (data == null) {
      res.send({ status: "ERROR", message: "PIN is required" });
    } else {
      users.findOne({ "name": data.username }, (error, user) => {
        var result = {};
        result.studentID = user.id;
        result.position_data = {data:"...to be decided..."};
        result.autograde = autograde;
        result.exerciseVersionID = parseInt(exerciseVersion);
        courses.updateOne({ "vr_tasks.ID": data.VRtaskID },{ $push: { "vr_tasks.$.completions": result }}, function (error, course)  {
          if (error) {
            return res.status(500).send(error);
          }
          pins.deleteOne({ "pin": pin }, (error, data) => {
            res.send({ status: "OK", message: "Exercise data successfully stored."});
          });
        });
      }); 
    }
  });
});

//function to get the token for the user
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
};

//function to get the pin for the user
async function get_pin(VRtaskID, user) {
  var query;
  var pin = "";
  query = await pins.findOne({"username": user.name, "VRtaskID":VRtaskID});
  if (query == null) {
    var pin_repeated = true;
    do {
      pin = create_pin();
      query = await pins.findOne({ "pin": pin})
      if (query == null) {
        pin_repeated = false;
      }
    }while (pin_repeated);
    var pin_user_vrtask = { "pin": pin, "username": user.name, "VRtaskID": VRtaskID };
    pins.insertOne(pin_user_vrtask, function(err, res) {
      if (err) throw err;
          });
  }else{
    pin = query.pin;
  }
   return pin;
};

//function to get a string of four numbers
function create_pin() {
  var pin = "";
  for (let index = 0; index < 4; index++) {
    pin += Math.floor(Math.random() * 10);
  }
  return pin;
};
