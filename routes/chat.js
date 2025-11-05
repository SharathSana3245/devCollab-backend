const express = require("express");
const chatRouter = express.Router();
const Chat = require("../models/Chat");

const { userAuth } = require("../middlewares/auth");

chatRouter.post("/chat", userAuth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
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

chatRouter.post("/chat/group", userAuth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).send("targetUserId is required");
    }
    const user = req.user;
    let chat = await Chat.findById(targetUserId).populate({
      path: "messages.sender",
      select: "firstName lastName",
    });
    if (!chat) {
      return res.status(404).send("Group chat not found");
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
      .select({
        participants: 1,
        messages: { $slice: -1 },
        isGroupChat: 1,
        groupName: 1,
      })
      .sort({ updatedAt: -1 });

    const formattedChats = participants.map((chat) => {
      if (chat.isGroupChat) {
        return {
          _id: chat._id,
          isGroupChat: true,
          groupName: chat.groupName,
          participants: chat.participants, // all group members
          lastMessage: chat.messages?.[0] || chat.lastMessage || null,
        };
      } else {
        const otherParticipant = chat.participants.find(
          (p) => p._id.toString() !== user._id.toString()
        );

        return {
          _id: chat._id,
          isGroupChat: false,
          participant: otherParticipant,
          lastMessage: chat.messages?.[0] || chat.lastMessage || null,
        };
      }
    });

    res.json(formattedChats);
  } catch (err) {
    res.status(404).send("Error" + err.message);
  }
});

chatRouter.post("/chat/createGroup", userAuth, async (req, res) => {
  try {
    const { groupName, participantIds } = req.body;
    if (!groupName || !participantIds || participantIds.length === 0) {
      return res.status(400).send("Group name and participants are required");
    }

    const user = req.user;

    let existingGroup = await Chat.findOne({
      isGroupChat: true,
      participants: {
        $all: [user._id, ...participantIds],
        $size: [user._id, ...participantIds].length,
      },
    });

    if (existingGroup) {
      return res
        .status(400)
        .send("Group chat with the same participants already exists");
    }

    const chat = new Chat({
      groupName,
      participants: [user._id, ...participantIds],
      isGroupChat: true,
      admins: [user._id],
      messages: [],
    });
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(404).send("Error" + err.message);
  }
});

module.exports = chatRouter;
