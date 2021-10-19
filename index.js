require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
require("./static/app/js/db.js");
var { register, signup } = require("./static/app/js/model");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const auth = require("./static/app/js/auth");

const port = process.env.PORT || 5000;

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "static")));
app.engine("html", require("ejs").renderFile);

app.get("/", (req, res) => {
  res.render(__dirname + "/views/index.html");
});

app.get("/register", (req, res) => {
  res.render(__dirname + "/views/register.html", { message: "" });
});

// storing data in DB
app.post("/register", (req, res) => {
  var mydata = new register(req.body);
  mydata
    .save()
    .then(() => {
      //   res.send("The file is stored in the database successfully");
      res
        .status(200)
        .render(__dirname + "/views/register.html", { message: "success" });
    })
    .catch(() => {
      //   res.status(404).send("Item was not saved!!!");
      res
        .status(404)
        .render(__dirname + "/views/register.html", { message: "failed" });
    });
  //   mydata.speak();
});
app.get("/signup", (req, res) => {
  res.render(__dirname + "/views/signup.html");
});
app.post("/signup", async (req, res) => {
  var { semail, spassword } = req.body;
  const userData = new signup({
    semail,
    spassword,
  });
  // console.log(userData);
  const token = await userData.generateToken();
  // console.log("token", token);
  res.cookie("jwt", token, {
    expires: new Date(Date.now + 50000),
    // httpOnly: true,
  });
  const registered = userData
    .save()
    .then(() => {
      res.render(__dirname + "/views/index.html", { isLoggedIn: "true" });
    })
    .catch((err) => {
      console.log(err);
      res.status(404).send("user not created");
    });
});

//login

app.get("/login", (req, res) => {
  res.render(__dirname + "/views/login.html", {
    message: "",
  });
});

app.post("/login", async (req, res) => {
  try {
    const { lemail, lpassword } = req.body;
    console.log(lemail, lpassword);
    const isEmail = await signup.findOne({ semail: lemail });
    console.log(isEmail.spassword);
    const isMatch = await bcrypt.compare(lpassword, isEmail.spassword);
    const token = await isEmail.generateToken();
    res.cookie("jwt", token, {
      expires: new Date(Date.now + 50000),
      // httpOnly: true,
    });
    console.log("token", token);
    if (isMatch) {
      res.render(__dirname + "/views/index.html", { isLoggedIn: "true" });
    } else {
      res.render(__dirname + "/views/login.html", {
        message: "Invalid Credentials",
      });
    }
  } catch (err) {
    res.render(__dirname + "/views/index.html", {
      message: "Invalid Credentials",
    });
  }
});

//logout user

app.get("/getdetails", (req, res) => {
  const { bld = "", loc = "" } = req.query;
  const sort = { fname: 1 };
  var query = {};
  if (bld.length != 0 && loc.length != 0) query = { bldgrp: bld, state: loc };
  else if (bld.length == 0 && loc.length != 0) query = { state: loc };
  else if (bld.length != 0 && loc.length == 0) query = { bldgrp: bld };
  register
    .find(query, (err, allDetails) => {
      if (err) {
        console.log(err);
      } else {
        res.render(__dirname + "/views/getDetails.html", {
          details: allDetails,
        });
      }
    })
    .sort(sort);
});

// const securePass = async (pass) => {
//   const b = await bcrypt.hash(pass, 10);
//   console.log(b);
// };
// securePass("hiyy@1333");
app.listen(port, () => {
  console.log(
    `The application started successfully at : http://localhost:${port}`
  );
});
