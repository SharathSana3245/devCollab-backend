const socket = require("socket.io");
const Chat = require("../models/Chat");

const initSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  io.on("connection", (socket) => {
    socket.on("disconnect", () => {});

    socket.on("message", () => {});

    socket.on("joinChat", ({ loggedInUserId, targetUserId }) => {
      const room = [loggedInUserId, targetUserId].sort().join("_");
      socket.join(room);
    });

    socket.on(
      "sendMessage",
      async ({ firstName, loggedInUserId, targetUserId, message }) => {
        const room = [loggedInUserId, targetUserId].sort().join("_");
        try {
          let chat = await Chat.findOne({
            participants: { $all: [loggedInUserId, targetUserId] },
          });

          if (!chat) {
            chat = new Chat({
              participants: [loggedInUserId, targetUserId],
              messages: [],
            });
          }
          chat.messages.push({ sender: loggedInUserId, message });
          await chat.save();
        } catch (err) {
          console.error("Error", err);
        }

        io.to(room).emit("receiveMessage", {
          message,
          senderId: loggedInUserId,
          from: firstName,
        });

        //   participants: { $in: [loggedInUserId] },
        // })
        //   .populate({ path: "participants", select: "_id, firstName lastName" })
        //   .select({ participants: 1, messages: { $slice: -1 } })
        //   .sort({ updatedAt: -1 });

        // const formattedChats = participants.map((chat) => {
        //   const otherParticipant = chat.participants.find(
        //     (p) => p._id.toString() !== loggedInUserId.toString()
        //   );

        //   return {
        //     _id: chat._id,
        //     lastMessage: chat.messages[0],
        //     participant: otherParticipant,
        //   };
        // });

        // io.to(room).emit("updateChatList", formattedChats);
      }
    );
  });
  return io;
};

module.exports = initSocket;
