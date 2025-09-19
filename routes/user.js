const express = require("express");
const User = require("../models/user");

const { userAuth } = require("../middlewares/auth");
const connectionRequestModel = require("../models/connectRequest");

const userRouter = express.Router();

const userSafeData = [
  "firstName",
  "lastName",
  "skills",
  "gender",
  "photoUrl",
  "about",
  "age"
];

userRouter.get("/user/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const connectionRequests = await connectionRequestModel
      .find({
        $or: [
          {
            fromUserId: loggedInUser._id,
          },
          { toUserId: loggedInUser._id },
        ],
      })
      .select("fromUserId toUserId");

    const hideUsersFromFeed = new Set();

    connectionRequests.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });

    const users = await User.find({
      $and: [
        {
          _id: {
            $nin: Array.from(hideUsersFromFeed),
          },
        },
        { _id: { $ne: loggedInUser._id } },
      ],
    })
      .select(userSafeData)
      .skip(skip)
      .limit(limit);
    res.json({ data: users });
  } catch (err) {
    res.status(404).send("error in fetching users" + err.message);
  }
});

userRouter.get("/user/requests/recieved", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const requests = await connectionRequestModel
      .find({
        toUserId: loggedInUser._id,
        status: "interested",
      })
      .populate("fromUserId", userSafeData);
    res.json({
      message: "Data fetched",
      data: requests,
    });
  } catch (err) {
    res.status(404).send("ERROR" + err.message);
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  const loggedInUser = req.user;
  try {
    const connections = await connectionRequestModel
      .find({
        $or: [
          {
            toUserId: loggedInUser._id,
            status: "accepted",
          },
          {
            fromUserId: loggedInUser._id,
            status: "accepted",
          },
        ],
      })
      .populate("fromUserId", userSafeData)
      .populate("toUserId", userSafeData);

    

    const data = connections.map((connection) => {
      if (
        connection.fromUserId._id.toString() === loggedInUser._id.toString()
      ) {
        return connection.toUserId;
      }
      return connection.fromUserId;
    });
    res.json({ message: "Connections", data: data });
  } catch (err) {
    res.status(400).send("ERROR" + err.message);
  }
});

module.exports = userRouter;
