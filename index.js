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
      result = { status: "ERROR", message: "Session_token is required" };
    } else {
      result = { status: "OK", message: "Session successfully closed" }
    }
    res.send(result);
  });
});

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
        console.log(data.VRtaskID)
        courses.updateOne({ "vr_tasks.ID": data.VRtaskID },{ $push: { "vr_tasks.$.completions": result }}, function (error, course)  {
          if (error) {
            return res.status(500).send(error);
          }
            res.send({ status: "OK", message: "Exercise data successfully stored."});
        });
      }); 
    }
  });
});

// async function get_modified_course_list(course_list){
//   var new_course_list = [];
//   for (var j = 0; j < course_list.length; j++) {
//     get_teachers_names(course.subscribers.teachers).then(val => {
//       var course = {title : course_list[j].title, description : course_list[j].description, teachers : val};
//       new_course_list.push(course);
//     });
//   }
//   return course_list;
// }

// async function get_teachers_names(course_list) {
//   var new_course_list = course_list.map( async function(course) {
//       var teachers_names = [];
//       var teachers = await users.find({ "id": { $in: course.subscribers.teachers } }).toArray();
//       if (teachers == null) {
//         console.log("Users not found");
//       } else {
//         for (var i = 0; i < teachers.length; i++) {
//           teachers_names.push(teachers[i].name);
//         }
//         course.subscribers.teachers = teachers_names;
//       }
//     });
//     return new_course_list;
  // for (let j = 0; j < course_list.length; j++) {
  //   var teachers_names = [];
  //   var teachers = await users.find({ "id": { $in: course_list[j].subscribers.teachers } }).toArray();
  //   if (teachers == null) {
  //     console.log("Users not found");
  //   } else {
  //     for (var i = 0; i < teachers.length; i++) {
  //       teachers_names.push(teachers[i].name);
  //     }

  //   }
  // }
  // return new_course_list;
// };



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

function create_pin() {
  var pin = "";
  for (let index = 0; index < 4; index++) {
    pin += Math.floor(Math.random() * 10);
  }
  return pin;
};
