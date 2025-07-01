import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log("Verbindung zur MongoDB hergestellt");
  } catch (error) {
    console.error(`Fehler bei der Verbindung zur MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
