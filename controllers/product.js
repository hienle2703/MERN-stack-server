import cloudinary from "cloudinary";

import { asyncError } from "../middlewares/error.js";

// Models
import { Product } from "../models/product.js";
import { Category } from "../models/category.js";

// Utils
import ErrorHandler from "../utils/error.js";
import { getDataUri } from "../utils/features.js";

export const getAllProducts = asyncError(async (req, res, next) => {
  // Search & category query
  const { keyword, category } = req.query;

  const products = await Product.find({
    name: {
      $regex: keyword ? keyword : "",
      $options: "i", // insensitive
    },
    category: category ? category : undefined,
  });

  if (!products) return next(new ErrorHandler("Products Not Found", 404));

  res.status(200).json({
    success: true,
    products,
  });
});

export const getAdminProducts = asyncError(async (req, res, next) => {
  const products = await Product.find({}).populate("category"); //.populate("category") => Thay vì trả ra category: "abcxyz" thì nó sẽ lấy nguyên object bên collection Category bỏ vô

  const outOfStock = products.filter((item) => item.stock === 0);
  res.status(200).json({
    success: true,
    products,
    outOfStock: outOfStock.length,
    inStock: products.length - outOfStock.length,
  });
});

export const getProductDetails = asyncError(async (req, res, next) => {
  // Search & category query
  const product = await Product.findById(req.params.id).populate("category");

  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  res.status(200).json({
    success: true,
    product,
  });
});

export const createProduct = asyncError(async (req, res, next) => {
  const { name, description, category, price, stock } = req.body;

  if (!req.file) return next(new ErrorHandler("Please upload an image", 400));

  const isExistCategory = await Category.findById(category);
  if (!isExistCategory)
    return next(new ErrorHandler("Category is not exist", 400));

  const file = getDataUri(req.file);
  const myCloud = await cloudinary.v2.uploader.upload(file.content);
  const image = {
    public_id: myCloud.public_id,
    url: myCloud.secure_url,
  };

  const product = await Product.create({
    name,
    description,
    category,
    price,
    stock,
    images: [image],
  });

  res.status(200).json({
    success: true,
    message: "Product created successfully",
    product,
  });
});

export const updateProduct = asyncError(async (req, res, next) => {
  const { name, description, category, price, stock } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  if (name) product.name = name;
  if (description) product.description = description;
  if (category) product.category = category;
  if (price) product.price = price;
  if (stock) product.stock = stock;

  await product.save();

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
  });
});

export const deleteProduct = asyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.v2.uploader.destroy(product.images[i].public_id);
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

export const addProductImage = asyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  if (!req.file) return next(new ErrorHandler("Please upload an image", 400));

  const file = getDataUri(req.file);
  const myCloud = await cloudinary.v2.uploader.upload(file.content);
  const image = {
    public_id: myCloud.public_id,
    url: myCloud.secure_url,
  };

  product.images.push(image);
  await product.save();

  res.status(200).json({
    success: true,
    message: "Image added successfully",
  });
});

export const deleteProductImage = asyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  const id = req.query.id;
  if (!id) return next(new ErrorHandler("Please provide an image id", 400));

  let isExist = -1;

  product.images.forEach((item, index) => {
    if (item._id.toString() === id.toString()) {
      isExist = index;
    }
  });

  if (isExist < 0) return next(new ErrorHandler("Image Not Found", 404));

  await cloudinary.v2.uploader.destroy(product.images[isExist].public_id);
  product.images.splice(isExist, 1);

  await product.save();

  res.status(200).json({
    success: true,
    message: "Product Image Removed Successfully",
  });
});

// Category APIs
export const addCategory = asyncError(async (req, res, next) => {
  const category = await Category.findOne({ category: req.body.category });

  if (category) {
    return next(new ErrorHandler("Category already exist", 400));
  }

  await Category.create(req.body);

  res.status(201).json({
    success: true,
    message: "Category added successfully",
  });
});

export const getAllCategories = asyncError(async (req, res) => {
  const categories = await Category.find();

  res.status(200).json({
    success: true,
    categories,
  });
});

export const deleteCategory = asyncError(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) return next(new ErrorHandler("Category Not Found", 404));

  // Remove category trong toàn bộ product thuộc category đó.
  const products = await Product.find({ category: category._id });

  for (let i = 0; i < products.length; i++) {
    products[i].category = undefined; // Dùng undefined thì nó sẽ remove cả cái key trong item db luôn
    await products[i].save();
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});
