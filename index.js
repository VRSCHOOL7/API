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

  var username = req.body.username;
  var password = req.body.password;
  var result;

  users.findOne({ "name": username, "password": password},  (error, query) => {
    if(error) {
        return res.status(500).send(error);
    }
    if (query==null) {
      result = {status : "ERROR", message : "User not found", session_token : "" };
    }else{

      var token = get_token(query);
      
      

      console.log(token);
    } 

    res.send(result);
  });
});

app.get('/api/logout', (req, res) => {
  
});

app.get('/api/get_course', (req, res) => {

});

app.get('/api/get_course_details', (req, res) => {

});

function get_token(user) {
  if (user.token == ''){
    var newvalues = { $set: {token: "12345678" } };
    users.updateOne(user, newvalues, function(err, res) {
      if (err) throw err;
      console.log("1 document updated");
    });
    return crypto.createHash('md5').update(user.name + user.password).digest('hex');

  }

}