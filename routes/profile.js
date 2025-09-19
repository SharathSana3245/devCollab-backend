const express = require("express");
const { validateEditProfileData } = require("../utils/helper");
const { userAuth } = require("../middlewares/auth");
const validator = require("validator");
const bcrpyt = require("bcrypt");

const profileRouter = express.Router();

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      res.send("User doesn't exist");
    }
    res.send(req.user);
  } catch (error) {
    res.status(400).send("ERROR" + error.message);
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  const id = req?.params.userId;
  const data = req.body;

  try {
    if (!validateEditProfileData(req)) {
      throw new Error("Invalid  request data");
    } else {
      const loggedInUser = req.user;
      Object.keys(req.body).forEach(
        (key) => (loggedInUser[key] = req.body[key])
      );
      await loggedInUser.save();
      res
        .status(200)
        .json({
          message: "Profile Updated Successfully!!",
          data: loggedInUser,
        });
    }
  } catch (err) {
    res.status(404).send("Error while updating the user" + err.message);
  }
});

profileRouter.patch("/profile/passwordChange", userAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = req.user;
    const passwordMatch = await user.validatePassword(oldPassword);
    const newPasswordValidator = validator.isStrongPassword(newPassword);
    if (!passwordMatch) {
      throw new Error("Password you entered is invalid!!");
    } else if (!newPasswordValidator) {
      throw new Error("Entered new password is not strong password!!");
    } else {
      const newPasswordHash = await bcrpyt.hash(newPassword, 10);
      user.password = newPasswordHash;
      user.save();
      res.send("Password Changed Successfully!!");
    }
  } catch (err) {
    res.status(400).send(`Error ${err.message}`);
  }
});

module.exports = profileRouter;
