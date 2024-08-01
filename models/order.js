import mongoose from "mongoose";

const schema = new mongoose.Schema({
  shippingInfo: {
    address: {
      type: String,
      require: true,
    },
    city: {
      type: String,
      require: true,
    },
    country: {
      type: String,
      require: true,
    },
    pinCode: {
      type: Number,
      require: true,
    },
  },

  orderItems: [
    {
      name: {
        type: String,
        require: true,
      },
      price: {
        type: Number,
        require: true,
      },
      quantity: {
        type: Number,
        require: true,
      },
      image: {
        type: String,
        require: true,
      },
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        require: true,
      },
    },
  ],

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },

  paymentMethod: {
    type: String,
    enum: ["COD", "ONLINE"],
    default: "COD",
  },

  paidAt: Date,
  paymentInfo: {
    id: String,
    status: String,
  },

  itemsPrice: {
    type: Number,
    require: true,
  },
  taxPrice: {
    type: Number,
    require: true,
  },
  shippingCharges: {
    type: Number,
    require: true,
  },
  totalAmount: {
    type: Number,
    require: true,
  },

  orderStatus: {
    type: String,
    enum: ["PREPARING", "SHIPPED", "DELIVERED"],
  },

  deliveredAt: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Order = mongoose.model("Order", schema);
