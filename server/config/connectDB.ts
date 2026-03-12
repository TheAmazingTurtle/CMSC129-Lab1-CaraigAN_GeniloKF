import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

type DbRole = 'primary' | 'backup';

const PRIMARY_LABEL = 'primary';
const BACKUP_LABEL = 'backup';

let activeRole: DbRole = PRIMARY_LABEL;
let primaryCheckTimer: NodeJS.Timeout | null = null;
let isFailingOver = false;
let isSyncing = false;
let primaryUri = '';
let backupUri = '';

const connectWithUri = async (uri: string, label: DbRole) => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`Connected to MongoDB Atlas (${label})`);
};

const clearPrimaryCheck = () => {
  if (primaryCheckTimer) {
    clearInterval(primaryCheckTimer);
    primaryCheckTimer = null;
  }
};

const getUpdatedAt = (doc: any) => {
  if (!doc || !doc.updatedAt) return 0;
  const ts = new Date(doc.updatedAt).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

const syncBackupToPrimary = async (backupConn: mongoose.Connection, primaryConn: mongoose.Connection) => {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const collections = (await backupConn.db.listCollections().toArray())
      .filter((collection) => !collection.name.startsWith('system.'));

    for (const collection of collections) {
      const name = collection.name;
      const backupCollection = backupConn.db.collection(name);
      const primaryCollection = primaryConn.db.collection(name);

      const cursor = backupCollection.find({});
      while (await cursor.hasNext()) {
        const backupDoc = await cursor.next();
        if (!backupDoc) continue;

        const primaryDoc = await primaryCollection.findOne({ _id: backupDoc._id }, { projection: { updatedAt: 1 } });
        const backupUpdatedAt = getUpdatedAt(backupDoc);
        const primaryUpdatedAt = getUpdatedAt(primaryDoc);

        if (!primaryDoc || backupUpdatedAt >= primaryUpdatedAt) {
          await primaryCollection.replaceOne({ _id: backupDoc._id }, backupDoc, { upsert: true });
        }
      }
    }

    console.log('Primary resynced from backup (upsert + newest wins).');
  } finally {
    isSyncing = false;
  }
};

const switchToPrimary = async (backupConn: mongoose.Connection) => {
  const primaryConn = await mongoose.createConnection(primaryUri, { serverSelectionTimeoutMS: 5000 }).asPromise();
  await syncBackupToPrimary(backupConn, primaryConn);
  await primaryConn.close();

  await mongoose.disconnect();
  await connectWithUri(primaryUri, PRIMARY_LABEL);
  activeRole = PRIMARY_LABEL;
  clearPrimaryCheck();
};

const startPrimaryCheck = () => {
  if (primaryCheckTimer || !primaryUri) return;

  primaryCheckTimer = setInterval(async () => {
    if (activeRole !== BACKUP_LABEL || isFailingOver) return;

    try {
      const primaryConn = await mongoose.createConnection(primaryUri, { serverSelectionTimeoutMS: 3000 }).asPromise();
      await primaryConn.close();
      await switchToPrimary(mongoose.connection);
    } catch {
      // Primary still unavailable.
    }
  }, 8000);
};

const failoverToBackup = async () => {
  if (isFailingOver || activeRole === BACKUP_LABEL || !backupUri) return;
  isFailingOver = true;

  try {
    await mongoose.disconnect();
    await connectWithUri(backupUri, BACKUP_LABEL);
    activeRole = BACKUP_LABEL;
    startPrimaryCheck();
  } catch (err) {
    console.error('MongoDB connection error (backup):', err);
  } finally {
    isFailingOver = false;
  }
};

const attachPrimaryListeners = () => {
  mongoose.connection.on('error', async () => {
    if (activeRole === PRIMARY_LABEL) {
      console.error('MongoDB connection error (primary). Failing over to backup.');
      await failoverToBackup();
    }
  });

  mongoose.connection.on('disconnected', async () => {
    if (activeRole === PRIMARY_LABEL) {
      console.error('MongoDB disconnected (primary). Failing over to backup.');
      await failoverToBackup();
    }
  });
};

const connectDB = async () => {
  dns.setServers(['1.1.1.1', '8.8.8.8']);

  dotenv.config();
  primaryUri = process.env.MONGO_URI || '';
  backupUri = process.env.MONGO_URI_BACKUP || '';

  if (!primaryUri) {
    throw new Error('MONGO_URI must be set.');
  }

  try {
    await connectWithUri(primaryUri, PRIMARY_LABEL);
    activeRole = PRIMARY_LABEL;
    attachPrimaryListeners();
  } catch (err) {
    console.error('MongoDB connection error (primary):', err);
    if (!backupUri) {
      throw err;
    }

    await connectWithUri(backupUri, BACKUP_LABEL);
    activeRole = BACKUP_LABEL;
    startPrimaryCheck();
  }
};

export { connectDB };
