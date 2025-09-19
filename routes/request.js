const express = require("express");
const { userAuth } = require("../middlewares/auth");
const connectionRequestModel = require("../models/connectRequest");
const user = require("../models/user");

const requestRouter = express.Router();

requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      const allowedStatuses = ["interested", "ignored"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Improper status" });
      }

      if (fromUserId.toString() === toUserId) {
        return res
          .status(400)
          .json({ message: "You cannot send the request yourself" });
      }

      const toUserIdExists = await user.findById({ _id: toUserId });

      if (!toUserIdExists) {
        return res
          .status(400)
          .json({ message: "No user exists to sent connection request" });
      }

      const exisitingConnection = await connectionRequestModel.findOne({
        $or: [
          {
            fromUserId,
            toUserId,
          },
          {
            fromUserId: toUserId,
            toUserId: fromUserId,
          },
        ],
      });

      if (exisitingConnection) {
        return res
          .status(400)
          .json({ message: "Connection request already exists !!!" });
      }

      const data = new connectionRequestModel({
        fromUserId,
        toUserId,
        status,
      });
      await data.save();
      return res.json({
        message: "Connection built successfully",
        data,
      });
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
);

requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const allowedStatus = ["accepted", "rejected"];
      const loggedInUser = req.user;
      const { status, requestId } = req.params;
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "Not appropriate Status" });
      }
      const validConnection = await connectionRequestModel.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });

      if (!validConnection) {
        return res.status(404).json({ message: "Connection does not exists" });
      }

      validConnection.status = status;

      const data = await validConnection.save();

      res.json({
        message: `${status} connection request`,
        data,
      });
    } catch (err) {
      res.status(400).send("ERROR" + err.message);
    }
  }
);

module.exports = requestRouter;
