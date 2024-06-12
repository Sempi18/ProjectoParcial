const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { Sequelize, DataTypes, where } = require("sequelize");

//inicializamos nuestro servicio
const app = express();
const port = 3000;

//middlewares
app.use(cors());
//app.use(morgan());
app.use(express.json());

const sequelize = new Sequelize(
  "test", //Nombre base de datos
  "root", //Usuario base de datos
  "", //Contraseña base de datos
  {
    host: "localhost", //Servidor
    dialect: "mysql", //Tipo de base de datos
  }
);

async function conectardb() {
  try {
    await sequelize.authenticate();
    console.log("Conexion Realizada");
  } catch (error) {
    console.log("Conexion Fallida:", error);
  }
}

conectardb();