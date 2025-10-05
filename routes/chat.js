const express = require("express");
const chatRouter = express.Router();
const Chat = require("../models/Chat");

const { userAuth } = require("../middlewares/auth");

chatRouter.post("/chat", userAuth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if(!targetUserId){
      return res.status(400).send("targetUserId is required");
    }
    const user = req.user;
    let chat = await Chat.findOne({
      participants: { $all: [user._id, targetUserId] },
    }).populate({ path: "messages.sender", select: "firstName lastName" });
    if (!chat) {
      chat = new Chat({
        participants: [user._id, targetUserId],
        messages: [],
      }); 
      await chat.save();
    }
    res.json(chat);
  } catch (err) {
    res.status(404).send("Error" + err.message);
  }
});

chatRouter.get("/participants", userAuth, async (req, res) => {
  const user = req.user;
  try {
    let participants = await Chat.find({
      participants: { $in: [user._id] },
    })
      .populate({ path: "participants", select: "_id, firstName lastName" })
      .select({ participants: 1, messages: { $slice: -1 } })
      .sort({ updatedAt: -1 });

    const formattedChats = participants.map((chat) => {
      const otherParticipant = chat.participants.find(
        (p) => p._id.toString() !== user._id.toString()
      );

      return {
        _id: chat._id,
        lastMessage: chat.messages[0],
        participant: otherParticipant,
      };
    });
    res.json(formattedChats);
  } catch (err) {
    res.status(404).send("Error" + err.message);
  }
});

module.exports = chatRouter;
