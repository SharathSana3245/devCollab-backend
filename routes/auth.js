const express = require("express");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const validator = require("validator");
const User = require("../models/user");
const { validateBody } = require("../utils/helper");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
require("dotenv").config();

const authRouter = express.Router();

const generateOtp = () => Math.floor(100000 + Math.random() * 900000);

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) return reject(err);
      resolve(token);
    });
  });

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL,
      accessToken: accessToken.token,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
    },
  });
};
const sendEmail = async (emailOptions) => {
  try {
    const transporter = await createTransporter();
    await transporter.sendMail(emailOptions);
  } catch (err) {
    console.error("Email sending failed:", err);
    throw err;
  }
};

authRouter.post("/signup", async (req, res) => {
  const { firstName, lastName, emailId, password } = req.body;

  try {
    validateBody(req);

    if (!validator.isEmail(emailId)) {
      return res.status(400).json({ error: "Invalid email format." });
    }
    const domain = emailId.split("@")[1].toLowerCase();
    if (domain !== "gmail.com") {
      return res
        .status(400)
        .json({ error: "Only Gmail addresses are allowed." });
    }
    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists." });
    }

    const otp = generateOtp();

    const mailOptions = {
      from: process.env.EMAIL,
      to: emailId,
      subject: "Your OTP for Signup",
      text: `Hello ${firstName}, your OTP is ${otp}. It is valid for 5 minutes.`,
    };

    await sendEmail(mailOptions);

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      otp,
      otpExpiresAt: Date.now() + 5 * 60 * 1000,
      isVerified: false,
    });

    await user.save();
    res.status(200).json({
      message: "OTP sent to your email. Please verify to complete signup.",
      emailId: user.emailId,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

authRouter.post("/verifyOtp", async (req, res) => {
  const { emailId, otp } = req.body;

  try {
    if (!emailId || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.otp !== Number(otp)) {
      return res.status(400).json({ error: "Invalid OTP." });
    }

    if (Date.now() > user.otpExpiresAt) {
      return res.status(400).json({ error: "OTP has expired." });
    }

    // OTP is valid → mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully." });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

authRouter.post("/login", async (req, res) => {
  const { emailId, password } = req.body;
  try {
    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      throw new Error("Not a valid Credentials");
    }

    // if(!user.isVerified){
    //   throw new Error("Email not verified. Please verify your email before logging in.");
    // }
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
