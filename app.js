const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");
const app = express();
const initSocket = require("./utils/socket");

const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const userRouter = require("./routes/user");
const requestRouter = require("./routes/request");
const chatRouter = require("./routes/chat");
const cors = require("cors");

const http = require("http");


app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use("/", [
  authRouter,
  profileRouter,
  userRouter,
  requestRouter,
  chatRouter
]);
const server = http.createServer(app);
const PORT = 3000;
initSocket(server);

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
