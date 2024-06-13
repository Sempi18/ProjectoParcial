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

const objeto_producto = sequelize.define(
  "productos",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
    },
    precio: {
      type: DataTypes.DECIMAL,
    },
    cantidad: {
      type: DataTypes.INTEGER,
    },
    categoria: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "productos", // Nombre de la tabla en la base de datos
    timestamps: false,
  }
);

app.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    msg: "Esta funcionando la Api",
  });
});

app.get("/productos", async (req, res) => {
  try {
    const productos = await objeto_producto.findAll();
    res.status(200).json({
      ok: true,
      msg: "Estos son los productos",
      dato: productos,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al obtener los productos",
      error: error.message,
    });
  }
});

app.get("/productos/encontrar", async (req, res) => {
  //ejemplo producto/find?id=1
  const { query } = req;
  const { id, nombre, categoria } = query;
  let productos = null;
  //Buscamos el producto con el numero ingresado
  if (id !== undefined) {
    productos = await objeto_producto.findByPk(id);
  } else {
    if (nombre !== undefined) {
      productos = await objeto_producto.findAll({
        where: { nombre: nombre },
      });
    } else {
      if (categoria !== undefined) {
        productos = await objeto_producto.findAll({
          where: { categoria: categoria },
        });
      } else {
        res.status(404).json({
          ok: false,
          msg: "Ingrese una opcion",
        });
      }
    }
  }
  if (productos === null)
    res.status(404).json({
      ok: false,
      msg: "No se ha encontrado",
    });
  else {
    res.status(200).json({
      ok: true,
      msg: "El producto se ha encontrado",
      dato: productos,
    });
  }
});

//Crear nuevo usuario:
app.post("/productos/crear", async (req, res) => {
  const { nombre, categoria, precio, cantidad } = req.body;

  try {
    const nuevo_producto = await objeto_producto.create({
      nombre,
      categoria,
      precio,
      cantidad,
    });

    if (nuevo_producto) {
      res.status(201).json({
        ok: true,
        msg: "producto agregado con éxito!",
        dato: nuevo_producto,
      });
    }
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "No se ha podido agregar el producto",
      error: error.message,
    });
  }
});

app.delete("/productos/eliminar", async (req, res) => {
  const { query } = req;
  const { id } = query;

  try {
    // Intenta encontrar y eliminar el producto
    const productos = await objeto_producto.findByPk(id);

    if (productos === null) {
      res.status(404).json({
        ok: false,
        msg: "No se ha encontrado el producto",
      });
    } else {
      await productos.destroy(); // Eliminar el producto encontrado
      res.status(200).json({
        ok: true,
        msg: "El producto ha sido eliminado con éxito",
        dato: productos,
      });
    }
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al eliminar el producto",
      error: error.message,
    });
  }
});

app.put("/productos/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria, precio, cantidad } = req.body;

  try {
    // Intentar encontrar el jugador por id
    const productos = await objeto_producto.findByPk(id);

    if (productos === null) {
      res.status(404).json({
        ok: false,
        msg: "No se ha encontrado el producto",
      });
    } else {
      // Actualizar la información del producto
      productos.nombre = nombre || productos.nombre; //Si el campo de la izquierda no vino, me quedo con el de la derecha
      productos.categoria = categoria || productos.categoria;
      productos.precio = precio || productos.precio;
      productos.cantidad = cantidad || productos.cantidad; //Si el campo de la izquierda no vino, me quedo con el de la derecha
      await productos.save(); // Guarda los cambios

      res.status(200).json({
        ok: true,
        msg: "El producto ha sido actualizado con éxito",
        dato: productos,
      });
    }
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al actualizar el producto",
      error: error.message,
    });
  }
});
app.get("/productos/ordenados", async (req, res) => {
  const { query } = req;
  const { criterio } = query;
  const allowedCriteria = ["nombre", "precio", "cantidad"];

  if (!criterio || !allowedCriteria.includes(criterio)) {
    return res.status(400).json({
      ok: false,
      msg: "El criterio de ordenación es requerido y debe ser uno de los siguientes: 'nombre', 'precio', 'cantidad'.",
    });
  }

  try {
    const productos = await objeto_producto.findAll({
      order: [[criterio, "ASC"]],
    });

    res.status(200).json({
      ok: true,
      msg: "Productos obtenidos exitosamente.",
      datos: productos,
    });
  } catch (error) {
    console.error("Error al obtener los productos:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener los productos.",
      error: error.message,
    });
  }
});

const { Op } = require("sequelize");
app.get("/productos/filtrados", async (req, res) => {
  const { query } = req;
  const { precioMin, precioMax, categoria } = query;
  const whereCondition = {};

  if (precioMin) {
    whereCondition.precio = { [Op.gte]: precioMin };
  }
  if (precioMax) {
    whereCondition.precio = whereCondition.precio || {};
    whereCondition.precio[Op.lte] = precioMax;
  }
  if (categoria) {
    whereCondition.categoria = categoria;
  }
  try {
    const productos = await objeto_producto.findAll({
      where: whereCondition,
    });

    res.status(200).json({
      ok: true,
      msg: "Productos filtrados obtenidos exitosamente.",
      datos: productos,
    });
  } catch (error) {
    console.error("Error al obtener los productos filtrados:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener los productos filtrados.",
      error: error.message,
    });
  }
});
// escuchamos el puerto 3000
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
