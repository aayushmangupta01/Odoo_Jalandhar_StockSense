const express = require("express");
const cors = require("cors");
const inventoryRoutes = require("./routes/inventoryRoutes");

const app = express();

// Global Permissive CORS Header Middleware (Fixes 403 Forbidden on Windows/Firewalls)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors({ origin: "*", credentials: false }));
app.use(express.json());

app.use("/api/inventory", inventoryRoutes);

app.get("/", (req, res) => {
  res.send("StockSense API Running...");
});

module.exports = app;