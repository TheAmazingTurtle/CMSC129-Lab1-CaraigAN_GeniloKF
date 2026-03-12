import mongoose from 'mongoose';
import User from '../models/User.ts';

const isDatabaseAvailable = () => mongoose.connection.readyState === 1;

const findUserByEmail = async (email: string) => {
  return User.findOne({ email, isDeleted: { $ne: true } });
};

const findUserById = async (userId: string) => {
  return User.findOne({ _id: userId, isDeleted: { $ne: true } });
};

const createUser = async (email: string, password: string) => {
  const newUser = new User({ email, password });
  await newUser.save();
  return newUser;
};

const deleteUserById = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { $set: { isDeleted: true, deletedAt: new Date() } });
};

const updateUserById = async (userId: string, update: Record<string, unknown>) => {
  return User.findOneAndUpdate(
    { _id: userId, isDeleted: { $ne: true } },
    { $set: update },
    { returnDocument: 'after' }
  );
};

export {
  isDatabaseAvailable,
  findUserByEmail,
  findUserById,
  createUser,
  deleteUserById,
  updateUserById,
};
