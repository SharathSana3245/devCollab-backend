const validator = require("validator");

const validateBody = (req) => {
  const { firstName, lastName, emailId, password } = req.body;

  if (!firstName || !lastName) {
    throw new Error("Not Valid Name");
  } else if (!validator.isEmail(emailId)) {
    throw new Error("Not a valid email");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Not a strong password");
  }
};

const validateEditProfileData = (req) => {
  const allowedUpdates = [
    "photoUrl",
    "skils",
    "gender",
    "age",
    "firstName",
    "lastName",
    "about",
  ];

  const isEditAllowed = Object.keys(req.body).every((field) =>
    allowedUpdates.includes(field)
  );

  return isEditAllowed
};

module.exports = {
  validateBody,
  validateEditProfileData
};
