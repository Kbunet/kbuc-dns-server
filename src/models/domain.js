const mongoose = require('mongoose');

const ownedProfileSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  link: { type: String },
  appData: { type: String },
  owner: { type: String },
  rps: { type: Number },
  ownershipType: { type: String },
  tenant: { type: String },
  rentedAt: { type: Number },
  duration: { type: Number },
  isCandidate: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  isDomain: { type: Boolean, default: false },
  offeredAt: { type: Number },
  bidAmount: { type: Number },
  buyer: { type: String },
  balance: { type: Number },
  bidTarget: { type: String }
});

const domainSchema = new mongoose.Schema({
  profileId: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  link: { type: String, required: true }, // IP address
  owner: { type: String },
  signer: { type: String },
  appData: { type: String },
  rps: { type: Number },
  ownedProfilesCount: { type: Number },
  isRented: { type: Boolean, default: false },
  tenant: { type: String },
  rentedAt: { type: Number },
  duration: { type: Number },
  isCandidate: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  missed: { type: Number },
  isDomain: { type: Boolean, default: true },
  offeredAt: { type: Number },
  bidAmount: { type: Number },
  buyer: { type: String },
  balance: { type: Number },
  bidTarget: { type: String },
  ownedProfiles: [ownedProfileSchema],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create indexes for faster lookups
domainSchema.index({ name: 1 });
domainSchema.index({ profileId: 1 });

module.exports = mongoose.model('Domain', domainSchema);
