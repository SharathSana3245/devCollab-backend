const express = require("express");
const authRouter = express.Router();
const { validateBody } = require("../utils/helper");
const bcrpyt = require("bcrypt");
const User = require("../models/user");



authRouter.post("/signup", async (req, res) => {
  const { firstName, lastName, emailId, password } = req.body;
  try {
    //api level santization or validation of data
    validateBody(req);
    //encrypt password
    const passwordHash = await bcrpyt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });
    await user.save();
  } catch (err) {
    res.status(404).send("error in saving the data" + err.message);
  }

  res.send("data saved");
});

authRouter.post("/login", async (req, res) => {
  const { emailId, password } = req.body;
  try {
    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      throw new Error("Not a valid Credentials");
    }
    const passwordMatch = await user.validatePassword(password);

    if (passwordMatch) {
      const token = await user.getJWT();
      res.cookie("token", token);
      res.json({
        message: "Login Successfull",
        user: user,
      });
    } else {
      throw new Error("Not a valid Credentials");
    }
  } catch (err) {
    res.status(404).send("Error:" + err.message);
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null).send("Logout done successfully!!");
});

module.exports = authRouter;
