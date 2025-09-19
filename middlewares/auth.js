const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).send("Please login!!");
    }

    const decodedObj = await jwt.verify(token, "devCollab@123");
    const { _id } = decodedObj;

    const user = await User.findById({ _id });
    if (!user) {
      return res.status(401).send("Please login!!");
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(400).send("ERROR" + error.message);
  }
};

module.exports = { userAuth };
