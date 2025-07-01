import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import asyncHandler from "./asyncHandler.js";

// first I want to authenticate the user
// so I want to check for the user credentials
// and I also want to check for the token

export const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Read JWT from the 'jwt' cookie
  token = req.cookies.jwt;

  if (token) {
    try {
      // ezt kivesézni
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select("-password"); // mongoose method
      next();
    } catch (error) {
      res.status(401).send("Not authorized, token failed.");
    }
  } else {
    res.status(401).send("Not authorized, no token.");
  }
});

// Check for the admin
export const authoriseAdmin = (req, res, next) => {
  // ezt kivesézni
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).send("Not authorized as an admin.");
  }
};
