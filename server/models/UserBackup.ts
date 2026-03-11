import mongoose from 'mongoose';
import User, { userSchema } from './User.ts';
import { backupConnection } from '../config/connectDB.ts';

let cachedModel: mongoose.Model<any> | null = null;

const isConnReady = (conn?: mongoose.Connection | null) => Boolean(conn && conn.readyState === 1);

const isPrimaryConnected = () => isConnReady(mongoose.connection);

const isBackupConnected = () => isConnReady(backupConnection);

const getBackupUserModel = () => {
  if (!backupConnection) return null;
  if (cachedModel) return cachedModel;
  cachedModel = backupConnection.model('User', userSchema);
  return cachedModel;
};

const getActiveUserModel = () => {
  if (isPrimaryConnected()) return User;
  const backup = getBackupUserModel();
  if (backup && isBackupConnected()) return backup;
  return User;
};

export {
  getBackupUserModel,
  getActiveUserModel,
  isPrimaryConnected,
  isBackupConnected,
};
