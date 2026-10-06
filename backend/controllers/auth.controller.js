import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateTokenAndSetCookies from "../utils/generateTokenAndSetCookies.js";

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    // 2. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Check if user already exists
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }
    // 4. 🔐 Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //generate 6 digit code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    // 4. Create user (password hashed by pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      verificationToken: verificationCode,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    // 5. Issue tokens + set cookies
    generateTokenAndSetCookies(res, user._id);

    // 6. Respond (never return the password)
    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        verificationToken: user.verificationToken,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "internal server error",
    });
    console.error(err);
  }
};
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({
        message: "Email and code are required",
      });
    }
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(404).json({
        message: "Invalid or expired verification code",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    res.json({
      message: "Email verified successfully",
    });
  } catch (err) {
    console.error(`error:${err}`);
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }
    generateTokenAndSetCookies(res, user._id);
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(`error:${err}`);
  }
};

export const logout = async (req, res) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
  res.status(200).json({ message: "Logged out successfully" });
};
