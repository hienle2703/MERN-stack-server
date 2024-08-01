import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter product name"],
  },
  description: {
    type: String,
    required: [true, "Please enter product description"],
  },
  price: {
    type: Number,
    required: [true, "Please enter product price"],
  },
  stock: {
    type: Number,
    required: [true, "Please enter product stock"],
  },
  images: [
    {
      public_id: String,
      url: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId, // Trỏ tới ID của schema Category
    ref: "Category",
  },
});

export const Product = mongoose.model("Product", schema);
