import { users, devices, clipboardSync, fileTransfers, aiSuggestions, bluetoothDevices, secureVault, type User, type InsertUser, type Device, type ClipboardItem, type FileTransfer, type AiSuggestion, type BluetoothDevice, type VaultItem } from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPreferences(userId: string, preferences: any): Promise<any>;
  
  // Device management
  getDevicesByUserId(userId: string): Promise<Device[]>;
  createDevice(device: any): Promise<Device>;
  updateDevice(id: string, updates: any): Promise<Device | undefined>;
  deleteDevice(id: string): Promise<boolean>;
  
  // Clipboard management
  getClipboardItems(userId: string): Promise<ClipboardItem[]>;
  createClipboardItem(item: any): Promise<ClipboardItem>;
  deleteClipboardItem(id: string): Promise<boolean>;
  
  // File transfer management
  getFileTransfers(userId: string): Promise<FileTransfer[]>;
  getFileTransfer(id: string): Promise<FileTransfer | undefined>;
  createFileTransfer(transfer: any): Promise<FileTransfer>;
  updateFileTransfer(id: string, updates: any): Promise<FileTransfer | undefined>;
  
  // AI suggestions
  getAISuggestions(userId: string): Promise<AiSuggestion[]>;
  createAISuggestion(suggestion: any): Promise<AiSuggestion>;
  updateAISuggestion(id: string, updates: any): Promise<AiSuggestion | undefined>;
  deleteAISuggestion(id: string): Promise<boolean>;
  
  // Bluetooth devices
  getBluetoothDevices(deviceId: string): Promise<BluetoothDevice[]>;
  createBluetoothDevice(device: any): Promise<BluetoothDevice>;
  
  // Secure vault
  getVaultItems(userId: string): Promise<VaultItem[]>;
  createVaultItem(item: any): Promise<VaultItem>;
  deleteVaultItem(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private devices: Map<string, Device>;
  private clipboardItems: Map<string, ClipboardItem>;
  private fileTransfers: Map<string, FileTransfer>;
  private aiSuggestions: Map<string, AiSuggestion>;
  private bluetoothDevices: Map<string, BluetoothDevice>;
  private vaultItems: Map<string, VaultItem>;
  private userPreferences: Map<string, any>;

  constructor() {
    this.users = new Map();
    this.devices = new Map();
    this.clipboardItems = new Map();
    this.fileTransfers = new Map();
    this.aiSuggestions = new Map();
    this.bluetoothDevices = new Map();
    this.vaultItems = new Map();
    this.userPreferences = new Map();
    
    // Add sample data for demo
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample data will be created when users first interact with the system
    // This ensures data integrity and authentic user experience
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    const now = new Date();
    const user: User = { 
      ...insertUser,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPreferences(userId: string, preferences: any): Promise<any> {
    const existing = this.userPreferences.get(userId) || {};
    const updated = { ...existing, ...preferences, updatedAt: new Date() };
    this.userPreferences.set(userId, updated);
    return updated;
  }

  async getDevicesByUserId(userId: string): Promise<Device[]> {
    return Array.from(this.devices.values()).filter(device => device.userId === userId);
  }

  async createDevice(deviceData: any): Promise<Device> {
    const id = crypto.randomUUID();
    const now = new Date();
    const device: Device = {
      ...deviceData,
      id,
      createdAt: now,
      updatedAt: now,
      lastSeen: now,
      isActive: true
    };
    this.devices.set(id, device);
    return device;
  }

  async updateDevice(id: string, updates: any): Promise<Device | undefined> {
    const device = this.devices.get(id);
    if (!device) return undefined;
    
    const updatedDevice = { ...device, ...updates, updatedAt: new Date() };
    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }

  async deleteDevice(id: string): Promise<boolean> {
    return this.devices.delete(id);
  }

  async getClipboardItems(userId: string): Promise<ClipboardItem[]> {
    return Array.from(this.clipboardItems.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.syncTimestamp).getTime() - new Date(a.syncTimestamp).getTime());
  }

  async createClipboardItem(itemData: any): Promise<ClipboardItem> {
    const id = crypto.randomUUID();
    const now = new Date();
    const item: ClipboardItem = {
      ...itemData,
      id,
      createdAt: now,
      syncTimestamp: now
    };
    this.clipboardItems.set(id, item);
    return item;
  }

  async deleteClipboardItem(id: string): Promise<boolean> {
    return this.clipboardItems.delete(id);
  }

  async getFileTransfers(userId: string): Promise<FileTransfer[]> {
    return Array.from(this.fileTransfers.values())
      .filter(transfer => transfer.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getFileTransfer(id: string): Promise<FileTransfer | undefined> {
    return this.fileTransfers.get(id);
  }

  async createFileTransfer(transferData: any): Promise<FileTransfer> {
    const id = crypto.randomUUID();
    const transfer: FileTransfer = {
      id,
      userId: transferData.userId,
      senderDeviceId: transferData.senderDeviceId,
      receiverDeviceId: transferData.receiverDeviceId || null,
      fileName: transferData.fileName,
      fileSize: transferData.fileSize,
      fileType: transferData.fileType || null,
      fileHash: null,
      transferStatus: transferData.transferStatus || 'pending',
      transferMethod: transferData.transferMethod || 'cloud',
      encryptedMetadata: null,
      createdAt: new Date(),
      completedAt: null
    };
    this.fileTransfers.set(id, transfer);
    return transfer;
  }

  async updateFileTransfer(id: string, updates: any): Promise<FileTransfer | undefined> {
    const transfer = this.fileTransfers.get(id);
    if (!transfer) return undefined;
    
    const updatedTransfer = { ...transfer, ...updates };
    if (updates.transferStatus === 'completed') {
      updatedTransfer.completedAt = new Date();
    }
    this.fileTransfers.set(id, updatedTransfer);
    return updatedTransfer;
  }

  async getAISuggestions(userId: string): Promise<AiSuggestion[]> {
    return Array.from(this.aiSuggestions.values())
      .filter(suggestion => suggestion.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createAISuggestion(suggestionData: any): Promise<AiSuggestion> {
    const id = crypto.randomUUID();
    const suggestion: AiSuggestion = {
      ...suggestionData,
      id,
      createdAt: new Date(),
      used: false,
      expiresAt: suggestionData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    this.aiSuggestions.set(id, suggestion);
    return suggestion;
  }

  async updateAISuggestion(id: string, updates: any): Promise<AiSuggestion | undefined> {
    const suggestion = this.aiSuggestions.get(id);
    if (!suggestion) return undefined;
    
    const updatedSuggestion = { ...suggestion, ...updates };
    this.aiSuggestions.set(id, updatedSuggestion);
    return updatedSuggestion;
  }

  async deleteAISuggestion(id: string): Promise<boolean> {
    return this.aiSuggestions.delete(id);
  }

  async getBluetoothDevices(deviceId: string): Promise<BluetoothDevice[]> {
    return Array.from(this.bluetoothDevices.values()).filter(device => device.deviceId === deviceId);
  }

  async createBluetoothDevice(deviceData: any): Promise<BluetoothDevice> {
    const id = crypto.randomUUID();
    const device: BluetoothDevice = {
      ...deviceData,
      id,
      createdAt: new Date(),
      lastDiscovered: new Date()
    };
    this.bluetoothDevices.set(id, device);
    return device;
  }

  async getVaultItems(userId: string): Promise<VaultItem[]> {
    return Array.from(this.vaultItems.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createVaultItem(itemData: any): Promise<VaultItem> {
    const id = crypto.randomUUID();
    const now = new Date();
    const item: VaultItem = {
      ...itemData,
      id,
      createdAt: now,
      accessedAt: now
    };
    this.vaultItems.set(id, item);
    return item;
  }

  async deleteVaultItem(id: string): Promise<boolean> {
    return this.vaultItems.delete(id);
  }
}

export const storage = new MemStorage();