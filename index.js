const express = require('express');
const path = require('path');
require('dotenv').config();
const bodyParser = require('body-parser');
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const app = express();
const port = process.env.PORT || 5000;
const database_url = process.env.DATABASE_URL;

var database, courses;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(database_url);
  MongoClient.connect(database_url, { useNewUrlParser: true }, (error, client) => {
    if(error) {
        throw error;
    }
    database = client.db("VRSCHOOL7");
    courses = database.collection("Courses");
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

app.get('/login', (req, res) => {

});

app.get('/logout', (req, res) => {

});

app.get('/get_course', (req, res) => {

});

app.get('/get_course_details', (req, res) => {

});


