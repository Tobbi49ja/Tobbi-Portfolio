const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const apiRoutes = require("./email-routes/api");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../client")));

app.use("/api", apiRoutes);

const servePage = (page) =>
  path.join(__dirname, `../client/${page}/index.html`);

app.get("/", (req, res) => res.sendFile(servePage("home")));
app.get("/about", (req, res) => res.sendFile(servePage("about")));
app.get("/projects", (req, res) => res.sendFile(servePage("projects")));
app.get("/contact", (req, res) => res.sendFile(servePage("contact")));
app.get("/cv", (req, res) => res.sendFile(servePage("cv")));
app.get("/preview-index.html", (req, res) =>
  res.sendFile(servePage("preview"))
);

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../client/error/index.html"));
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
