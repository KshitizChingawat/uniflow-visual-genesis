import { pgTable, text, uuid, timestamp, bigint, boolean, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - extends from auth.users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Devices table
export const devices = pgTable("devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  deviceName: text("device_name").notNull(),
  deviceType: text("device_type").notNull(), // 'desktop', 'mobile', 'tablet', 'browser'
  platform: text("platform").notNull(), // 'windows', 'macos', 'linux', 'android', 'ios', 'browser'
  deviceId: text("device_id").notNull().unique(),
  publicKey: text("public_key"),
  lastSeen: timestamp("last_seen").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Clipboard sync table
export const clipboardSync = pgTable("clipboard_sync", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  deviceId: uuid("device_id").notNull().references(() => devices.id),
  content: text("content").notNull(),
  contentType: text("content_type").notNull().default('text'),
  encryptedContent: text("encrypted_content"),
  syncTimestamp: timestamp("sync_timestamp").defaultNow().notNull(),
  syncedToDevices: text("synced_to_devices").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// File transfers table
export const fileTransfers = pgTable("file_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  senderDeviceId: uuid("sender_device_id").notNull().references(() => devices.id),
  receiverDeviceId: uuid("receiver_device_id").references(() => devices.id),
  fileName: text("file_name").notNull(),
  fileSize: bigint("file_size", { mode: 'number' }).notNull(),
  fileType: text("file_type"),
  fileHash: text("file_hash"),
  transferStatus: text("transfer_status").notNull().default('pending'), // 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
  transferMethod: text("transfer_method").notNull().default('cloud'), // 'cloud', 'p2p', 'local'
  encryptedMetadata: jsonb("encrypted_metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// AI suggestions table
export const aiSuggestions = pgTable("ai_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  suggestionType: text("suggestion_type").notNull(), // 'clipboard_analysis', 'file_organization', 'device_recommendation', 'workflow_automation', 'content_categorization'
  content: jsonb("content").notNull(),
  confidenceScore: real("confidence_score"),
  used: boolean("used").default(false),
  feedbackScore: integer("feedback_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

// Bluetooth devices table
export const bluetoothDevices = pgTable("bluetooth_devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceId: uuid("device_id").references(() => devices.id),
  bluetoothMac: text("bluetooth_mac").notNull().unique(),
  deviceName: text("device_name").notNull(),
  deviceCapabilities: jsonb("device_capabilities").default({}),
  signalStrength: integer("signal_strength"),
  pairingStatus: text("pairing_status").default('discovered'), // 'discovered', 'pairing', 'paired', 'trusted', 'blocked'
  lastDiscovered: timestamp("last_discovered").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Secure vault table
export const secureVault = pgTable("secure_vault", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  itemType: text("item_type").notNull(), // 'clipboard', 'file', 'note'
  encryptedContent: text("encrypted_content").notNull(),
  metadata: jsonb("metadata"),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  accessedAt: timestamp("accessed_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClipboardSchema = createInsertSchema(clipboardSync).omit({
  id: true,
  createdAt: true,
  syncTimestamp: true,
});

export const insertFileTransferSchema = createInsertSchema(fileTransfers).omit({
  id: true,
  createdAt: true,
});

export const insertAiSuggestionSchema = createInsertSchema(aiSuggestions).omit({
  id: true,
  createdAt: true,
});

export const insertBluetoothDeviceSchema = createInsertSchema(bluetoothDevices).omit({
  id: true,
  createdAt: true,
});

export const insertSecureVaultSchema = createInsertSchema(secureVault).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type ClipboardItem = typeof clipboardSync.$inferSelect;
export type FileTransfer = typeof fileTransfers.$inferSelect;
export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type BluetoothDevice = typeof bluetoothDevices.$inferSelect;
export type VaultItem = typeof secureVault.$inferSelect;
