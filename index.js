const express = require('express')
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
//const mongoose = require('mongoose');
// const StudentModel = require('./models/students')
// const TeacherModel = require('./models/teachers')
const PORT = process.env.PORT || 5000
// const test = process.env;


// mongoose.connect()

// app.use(bodyParser.json());

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
//   res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
//   next();
// });


app.listen(port, () => (
  console.log(path)
));


app.get('/', (req, res) => {
    // Información recibida desde el explorador
    let student = req.query.student;

    // Array con los estudiantes
    let students = ["Student1", "Student2"];

    // Respuesta base
    let page = '<label>Buscador de Alumnos</label><input type="text" id="student"></input><input type="button" onclick="checkStudent()" value="Buscar"></input>';

    // Añadir JS de redirección a la respuesta base
    page += '<script>function checkStudent(){if (document.getElementById("student").value != "") {window.location.replace(window.location.origin + "/?student=" + document.getElementById("student").value)}else{window.location.replace(window.location.origin)}}</script>';

    // Dependiendo de si la variable student está definida y si se encuentra en students, mostrar el contenido correspondiente.
    if (students.includes(student)){
        res.send(page + `<p>Bienvenido ${student}</p>`);
    } else if (typeof(student) != 'undefined'){
        res.send(page + `<p>Estudiante ${student} no encontrado</p>`);
    } else {
        res.send(page);
    }
});

app.get('/login', (req, res) => {

});

app.get('/logout', (req, res) => {

});

app.get('/get_course', (req, res) => {

});

app.get('/get_course_details', (req, res) => {

});


