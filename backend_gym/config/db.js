import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gym_management');
    console.log('MongoDB conectado com sucesso!');
  } catch (err) {
    console.error('Erro ao conectar com MongoDB:', err.message);
    process.exit(1);
  }
};

export default connectDB;
