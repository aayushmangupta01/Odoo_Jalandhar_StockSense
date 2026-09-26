const express = require("express");
const cors = require("cors");
const inventoryRoutes = require("./routes/inventoryRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/inventory", inventoryRoutes);

app.get("/", (req, res) => {
  res.send("StockSense API Running...");
});

module.exports = app;