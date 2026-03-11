import { getBackupUserModel, getActiveUserModel, isPrimaryConnected, isBackupConnected } from '../models/UserBackup.ts';

const isDatabaseAvailable = () => isPrimaryConnected() || isBackupConnected();

const findUserByEmail = async (email: string) => {
  const ActiveUser = getActiveUserModel();
  let user = await ActiveUser.findOne({ email });

  if (!user && isPrimaryConnected() && isBackupConnected()) {
    const BackupUser = getBackupUserModel();
    if (BackupUser) {
      user = await BackupUser.findOne({ email });
    }
  }

  return user;
};

const findUserById = async (userId: string) => {
  const ActiveUser = getActiveUserModel();
  let user = await ActiveUser.findById(userId);

  if (!user && isPrimaryConnected() && isBackupConnected()) {
    const BackupUser = getBackupUserModel();
    if (BackupUser) {
      user = await BackupUser.findById(userId);
    }
  }

  return user;
};

const createUser = async (email: string, password: string) => {
  const ActiveUser = getActiveUserModel();
  const newUser = new ActiveUser({ email, password });
  await newUser.save();

  if (isPrimaryConnected() && isBackupConnected()) {
    const BackupUser = getBackupUserModel();
    if (BackupUser) {
      try {
        await BackupUser.create({ email, password });
      } catch (err) {
        console.warn('Backup signup failed:', err);
      }
    }
  }

  return newUser;
};

const deleteUserById = async (userId: string) => {
  const ActiveUser = getActiveUserModel();
  await ActiveUser.findByIdAndDelete(userId);

  if (isPrimaryConnected() && isBackupConnected()) {
    const BackupUser = getBackupUserModel();
    if (BackupUser) {
      try {
        await BackupUser.findByIdAndDelete(userId);
      } catch (err) {
        console.warn('Backup delete failed:', err);
      }
    }
  }
};

const updateUserById = async (userId: string, update: Record<string, unknown>) => {
  const ActiveUser = getActiveUserModel();
  const user = await ActiveUser.findByIdAndUpdate(
    userId,
    { $set: update },
    { returnDocument: 'after' }
  );

  if (isPrimaryConnected() && isBackupConnected()) {
    const BackupUser = getBackupUserModel();
    if (BackupUser) {
      try {
        await BackupUser.findByIdAndUpdate(
          userId,
          { $set: update },
          { returnDocument: 'after', upsert: true }
        );
      } catch (err) {
        console.warn('Backup save failed:', err);
      }
    }
  }

  return user;
};

export {
  isDatabaseAvailable,
  findUserByEmail,
  findUserById,
  createUser,
  deleteUserById,
  updateUserById,
};
