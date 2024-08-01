import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const { connection } = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "UdemyCourse",
    });

    console.log(`MongoDB Connected: ${connection.host}`);
  } catch (error) {
    console.log("Some error occur", error);
    process.exit(1);
  }
};
