import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

console.log(process.env.JWT_REFRESH_EXPIRES);

export default function generateTokenAndSetCookies(res, userId) {
  const isProd = process.env.NODE_ENV === "production";

  // 1. Generate tokens
  const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });

  // 2. Cookie options
  const accessCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
  };

  const refreshCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth/refresh",
  };

  // 3. Set both cookies
  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  // 4. Optionally return them for other uses
  return { accessToken, refreshToken };
}
