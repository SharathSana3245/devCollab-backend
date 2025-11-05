const validator = require("validator");

const validateBody = (req) => {
  const { firstName, lastName, emailId, password } = req.body;
  function isValidGmail(email) {
    const domain = email.split("@")[1].toLowerCase();
    return domain === "gmail.com";
  }

  if (!firstName || !lastName) {
    throw new Error("Not Valid Name");
  } else if (!isValidGmail(emailId)) {
    throw new Error("Not a valid gmail");
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

  return isEditAllowed;
};

module.exports = {
  validateBody,
  validateEditProfileData,
};
