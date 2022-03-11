const express = require('express'); // Importar express
const app = express(); // Asignar express a la variable app
const port = 8000; // Puerto para express

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

// Crear un servidor web con express el el puerto asignado en la varible port.
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});