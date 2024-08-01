import { asyncError } from "../middlewares/error.js";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/error.js";
import {
  cookieOptions,
  getDataUri,
  sendEmail,
  sendToken,
} from "../utils/features.js";
import cloudinary from "cloudinary";

export const getMyProfile = asyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

export const updateProfile = asyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const { name, email, address, city, country, pinCode } = req.body;

  if (name) user.name = name;
  if (email) user.email = email;
  if (address) user.address = address;
  if (city) user.city = city;
  if (country) user.country = country;
  if (pinCode) user.pinCode = pinCode;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
  });
});

export const changePassword = asyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return next(new ErrorHandler("Please enter current and new password", 400));

  const isMatched = await user.comparePassword(currentPassword);

  if (!isMatched) return next(new ErrorHandler("Incorrect Password", 400));

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

export const logOut = asyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", { ...cookieOptions, expires: new Date(Date.now()) })
    .json({
      success: true,
      message: "Logout successfully",
    });
});

export const login = asyncError(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Incorrect Email or Password", 400));
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(new ErrorHandler("Incorrect Email or Password", 400));
  }

  sendToken(user, res, `Welcome back, ${user.name}!`, 200);
});

export const signup = asyncError(async (req, res, next) => {
  const { name, email, password, address, city, country, pinCode } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    return next(new ErrorHandler("Email already exists", 400));
  }

  let avatar;
  if (req.file) {
    // req.file
    const file = getDataUri(req.file);

    // Add Cloudinary here
    const myCloud = await cloudinary.v2.uploader.upload(file.content);

    avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  user = await User.create({
    name,
    email,
    password,
    address,
    avatar,
    city,
    country,
    pinCode,
  });

  sendToken(user, res, "User created successfully!", 201);
});

export const updatePic = asyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const file = getDataUri(req.file);

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  const myCloud = await cloudinary.v2.uploader.upload(file.content);
  user.avatar = {
    public_id: myCloud.public_id,
    url: myCloud.secure_url,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Avatar updated successfully",
  });
});

export const forgetPassword = asyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // max, min, 2000, 10000
  const randomNumber = Math.random() * (9999999 - 100000) + 100000;
  const otp = Math.floor(randomNumber);
  const otp_expire = 1000 * 60 * 15;

  user.otp = otp;
  user.otp_expire = new Date(Date.now() + otp_expire);

  await user.save();

  try {
    await sendEmail("OTP For Reset Password", user.email, `Your OTP is ${otp}`);
  } catch (error) {
    // In case send email fail, we have to clear otp, otp_expire in order to clear the reset password flow
    user.otp = null;
    user.otp_expire = null;
    await user.save();
    return next(error);
  }

  res.status(200).json({
    success: true,
    message: `Email sent to ${user.email} successfully`,
  });
});

export const resetPassword = asyncError(async (req, res, next) => {
  const { password, otp } = req.body;
  const user = await User.findOne({ otp, otp_expire: { $gt: Date.now() } });
  // $gt là 1 toán tử của Mongoose - greater than - giá trị của field này lúc nào cũng phải lớn hơn giá trị Date.now()
  // Nghĩa là thời gian expire phải xa hơn bây giờ

  if (!user) {
    return next(new ErrorHandler("OTP is invalid or expired", 400));
  }

  if (!password) {
    return next(new ErrorHandler("Please enter password", 400));
  }

  user.password = password;
  user.otp = undefined;
  user.otp_expire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});
