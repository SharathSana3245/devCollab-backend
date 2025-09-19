const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref:'User'
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref:'User'
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["ignored", "interested", "accepted", "rejected"],
        message: `{VALUE} is incorrect status type`,
      },
    },
  },
  { timestamps: true }
);

connectionRequestSchema.pre("save", function (next) {
    //this function calls before save trigger for this model schema
    const request=this;
    if(request.fromUserId.equals(request.toUserId)){
        throw new Error('cannot send connection request to yourself')
    }
    next()
});

module.exports = mongoose.model(
  "connectionRequestModel",
  connectionRequestSchema
);
