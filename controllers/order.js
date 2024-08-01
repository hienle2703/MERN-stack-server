import { asyncError } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { stripe } from "../server.js";
import ErrorHandler from "../utils/error.js";

export const processPayment = asyncError(async (req, res, next) => {
  const { totalAmount } = req.body;
  const { client_secret } = await stripe.paymentIntents.create({
    amount: Number(totalAmount * 100),
    currency: "usd",
  });

  res.status(200).json({
    success: true,
    client_secret,
  });
});

export const createNewOrder = asyncError(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentMethod,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingCharges,
    totalAmount,
  } = req.body;

  await Order.create({
    user: req.user._id,
    shippingInfo,
    orderItems,
    paymentMethod,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingCharges,
    totalAmount,
  });

  // Trừ stock của từng sản phẩm sau khi lên đơn
  for (let i = 0; i < orderItems.length; i++) {
    const product = await Product.findOne({ _id: orderItems[i].product });
    product.stock -= orderItems[i].quantity;
    await product.save();
  }

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
  });
});

export const getAdminOrders = asyncError(async (req, res, next) => {
  const orders = await Order.find();

  res.status(200).json({
    success: true,
    orders,
  });
});

export const getMyOrders = asyncError(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });

  res.status(200).json({
    success: true,
    orders,
  });
});

export const getOrderDetail = asyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) return next(new ErrorHandler("Order not found", 404));

  res.status(200).json({
    success: true,
    order,
  });
});

export const processOrder = asyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) return next(new ErrorHandler("Order not found", 404));

  if (order.orderStatus === "PREPARING" || order.orderStatus === undefined) {
    order.orderStatus = "SHIPPED";
  } else if (order.orderStatus === "SHIPPED") {
    order.orderStatus = "DELIVERED";
    order.deliveredAt = new Date(Date.now());
  } else {
    return next(new ErrorHandler("Order already delivered", 400));
  }

  await order.save();

  res.status(200).json({
    success: true,
    message: "Order processed successfully",
    order,
  });
});
