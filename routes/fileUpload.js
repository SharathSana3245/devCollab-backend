const express = require("express");
const ImageKit = require("imagekit");
const app = express.Router();
const { userAuth } = require("../middlewares/auth");
// 🧠 Initialize ImageKit SDK
const imagekit = new ImageKit({
  publicKey: process.env.imageKitPublicKey,
  privateKey: process.env.imageKitPrivateKey,
  urlEndpoint: process.env.imageKitUrlEndpoint,
});

// 🪙 Auth endpoint to provide token, expire, and signature
app.get("/fileUpload/auth", userAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(400).send("User doesn't exist");
      return;
    }
    const authParams = await imagekit.getAuthenticationParameters();
    res.send(authParams);
  } catch (err) {
    res.status(400).send("ERROR" + err.message);
  }
});

module.exports = app;
