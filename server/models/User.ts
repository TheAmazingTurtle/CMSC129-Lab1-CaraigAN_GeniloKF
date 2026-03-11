import mongoose from 'mongoose';

const statSchema = new mongoose.Schema(
  {
    attack: { type: Number, default: 0 },
    defense: { type: Number, default: 0 },
    dexterity: { type: Number, default: 0 },
  },
  { _id: false }
);

const tempBuffSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    bonuses: { type: statSchema, default: () => ({}) },
    durationSteps: { type: Number, default: 0 },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, default: '' },
    type: { type: String, default: '' },
    level: { type: Number, default: 1 },
    rarity: { type: String, default: 'Common' },
    stat: { type: String, default: '' },
    flavorText: { type: String, default: '' },
    bonuses: { type: statSchema, default: () => ({}) },
    effects: {
      heal: { type: Number, default: 0 },
      tempBuff: { type: tempBuffSchema, default: undefined },
    },
  },
  { _id: false }
);

const buffSchema = new mongoose.Schema(
  {
    id: { type: String, default: '' },
    name: { type: String, default: '' },
    remainingSteps: { type: Number, default: 0 },
    bonuses: { type: statSchema, default: () => ({}) },
  },
  { _id: false }
);

const equipmentSchema = new mongoose.Schema(
  {
    'Weapon': { type: itemSchema, default: null },
    'Head Wear': { type: itemSchema, default: null },
    'Body Armor': { type: itemSchema, default: null },
    'Pants': { type: itemSchema, default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  hp: { type: Number, default: 100 },
  gold: { type: Number, default: 0 },
  exp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  skillPoints: { type: Number, default: 0 },
  skillStats: {
    type: statSchema,
    default: () => ({ attack: 0, defense: 0, dexterity: 0 })
  },
  buffs: { type: [buffSchema], default: [] },
  stepsTaken: { type: Number, default: 0 },
  totalDamageDealt: { type: Number, default: 0 },
  totalDamageReceived: { type: Number, default: 0 },
  totalGoldEarned: { type: Number, default: 0 },
  totalEnemiesDefeated: { type: Number, default: 0 },
  inventory: { type: [itemSchema], default: [] },
  equipment: {
    type: equipmentSchema,
    default: () => ({
      'Weapon': null,
      'Head Wear': null,
      'Body Armor': null,
      'Pants': null,
    }),
  },
});

const User = mongoose.model('User', userSchema);

export { userSchema };
export default User;
