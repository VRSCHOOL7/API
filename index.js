const express = require('express');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();
const bodyParser = require('body-parser');
const { ok } = require('assert');
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const app = express();
const port = process.env.PORT || 5000;
const database_url = process.env.DATABASE_URL;

var database, courses, users;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.listen(port, () => {
  console.log(database_url);
  MongoClient.connect(database_url, { useNewUrlParser: true }, (error, client) => {
    if(error) {
        throw error;
    }
    database = client.db("VRSCHOOL7");
    courses = database.collection("Couses");
    users = database.collection("Users");
    console.log("Connected to `VRSCHOOL7`!");
  });
});

app.get('/', (req, res) => {
    // // Información recibida desde el explorador
    // let student = req.query.student;

    // // Array con los estudiantes
    // let students = ["Student1", "Student2"];

    // // Respuesta base
    // let page = '<label>Buscador de Alumnos</label><input type="text" id="student"></input><input type="button" onclick="checkStudent()" value="Buscar"></input>';

    // // Añadir JS de redirección a la respuesta base
    // page += '<script>function checkStudent(){if (document.getElementById("student").value != "") {window.location.replace(window.location.origin + "/?student=" + document.getElementById("student").value)}else{window.location.replace(window.location.origin)}}</script>';

    // // Dependiendo de si la variable student está definida y si se encuentra en students, mostrar el contenido correspondiente.
    // if (students.includes(student)){
    //     res.send(page + `<p>Bienvenido ${student}</p>`);
    // } else if (typeof(student) != 'undefined'){
    //     res.send(page + `<p>Estudiante ${student} no encontrado</p>`);
    // } else {
    //     res.send(page);
    // }

    courses.find({}).toArray((error, result) => {
      if(error) {
          return res.status(500).send(error);
      }
      
      res.send(result);
      // res.sendFile(path.join(__dirname,'pages/login.html'));;

  });
});

app.get('/api/login', (req, res) => {
  var username = req.query.username;
  var password = req.query.password;
  var result;
  res.send(username);
  users.findOne({ "name": username, "password": password},  (error, query) => {
    if(error) {
        return res.status(500).send(error);
    }
    if (query==null) {
      result = {status : "ERROR", message : "user "+username   + "pass " + password, session_token : "" };
    }else{
      var token = get_token(query);
      result = {status : "OK", message : "Correct authentication", session_token : token }
    } 
    res.send(result);
  });
});

app.get('/api/logout', (req, res) => {
  var token = req.body.session_token, result;
  users.findOne({ "token": token},  (error, query) => {
    if(error) {
        return res.status(500).send(error);
    }
    if (query==null) {
      result = {status : "ERROR", message : "User not found", session_token : "" };
    }else{
      result = {status : "OK", message : "Session successfully closed", session_token : token }
    }
    res.send(result);
  });
});

app.get('/api/get_course', (req, res) => {
  var token = req.body.session_token, result;
});

app.get('/api/get_course_details', (req, res) => {

});

function get_token(user) {
  if (user.token != ''){
    if (Date.now() < user.expiration_time.getTime()) {
      return user.token;
    }
  }
    var random =Math.floor(Math.random() * 1000);
    var new_token = crypto.createHash('md5').update(user.name + user.password + random).digest('hex');
    var expiration_time = new Date(parseInt(Date.now()) + parseInt(process.env.TOKEN_EXPIRATION_TIME));
    var newvalues = { $set: {token: new_token, expiration_time: expiration_time } };
    users.updateOne(user, newvalues, function(err, res) {
      if (err) throw err;
    });
    return new_token;
}