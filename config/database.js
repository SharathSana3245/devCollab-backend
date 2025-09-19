const mongose = require("mongoose");

const connectDB = async () => {
  await mongose.connect(
    "mongodb+srv://SharathSanaDev:mAoS1lSYarUnwHSo@cluster0.hjrcxyg.mongodb.net/devCollab"
  );
};

module.exports=connectDB

