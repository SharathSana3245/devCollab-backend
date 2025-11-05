const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 4,
      maxLength: 30,
    },
    lastName: {
      type: String,
    },
    emailId: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Not a valid email");
        }
      },
    },
    password: {
      type: String,
      required: true,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Not a strong password");
        }
      },
    },
    age: {
      type: Number,
      min: 18,
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "others"],
        message: `{VALUE} is not a correct gender type`,
      },
    },
    photoUrl: {
      type: String,
    },
    about: {
      type: String,
    },
    skills: {
      type: [String],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: Number,
    },
    otpExpiresAt: {
      type: Date,
    },
    // 🔥 Field used for TTL cleanup of unverified users
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ✅ TTL Index: deletes unverified users 1 minute after creation
userSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 300, // change to 300 for 5 minutes
    partialFilterExpression: { isVerified: false },
  }
);

// JWT method
userSchema.methods.getJWT = async function () {
  const user = this;
  const token = await jwt.sign({ _id: user._id }, "devCollab@123");
  return token;
};

// Password validation
userSchema.methods.validatePassword = async function (password) {
  const user = this;
  return await bcrypt.compare(password, user.password);
};

module.exports = mongoose.model("User", userSchema);
