import { users, devices, clipboardSync, fileTransfers, aiSuggestions, bluetoothDevices, secureVault, type User, type InsertUser, type Device, type ClipboardItem, type FileTransfer, type AiSuggestion, type BluetoothDevice, type VaultItem } from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Device management
  getDevicesByUserId(userId: string): Promise<Device[]>;
  createDevice(device: any): Promise<Device>;
  updateDevice(id: string, updates: any): Promise<Device | undefined>;
  
  // Clipboard management
  getClipboardItems(userId: string): Promise<ClipboardItem[]>;
  createClipboardItem(item: any): Promise<ClipboardItem>;
  
  // File transfer management
  getFileTransfers(userId: string): Promise<FileTransfer[]>;
  createFileTransfer(transfer: any): Promise<FileTransfer>;
  updateFileTransfer(id: string, updates: any): Promise<FileTransfer | undefined>;
  
  // AI suggestions
  getAISuggestions(userId: string): Promise<AiSuggestion[]>;
  createAISuggestion(suggestion: any): Promise<AiSuggestion>;
  
  // Bluetooth devices
  getBluetoothDevices(deviceId: string): Promise<BluetoothDevice[]>;
  createBluetoothDevice(device: any): Promise<BluetoothDevice>;
  
  // Secure vault
  getVaultItems(userId: string): Promise<VaultItem[]>;
  createVaultItem(item: any): Promise<VaultItem>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private devices: Map<string, Device>;
  private clipboardItems: Map<string, ClipboardItem>;
  private fileTransfers: Map<string, FileTransfer>;
  private aiSuggestions: Map<string, AiSuggestion>;
  private bluetoothDevices: Map<string, BluetoothDevice>;
  private vaultItems: Map<string, VaultItem>;

  constructor() {
    this.users = new Map();
    this.devices = new Map();
    this.clipboardItems = new Map();
    this.fileTransfers = new Map();
    this.aiSuggestions = new Map();
    this.bluetoothDevices = new Map();
    this.vaultItems = new Map();
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

  async getClipboardItems(userId: string): Promise<ClipboardItem[]> {
    return Array.from(this.clipboardItems.values()).filter(item => item.userId === userId);
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

  async getFileTransfers(userId: string): Promise<FileTransfer[]> {
    return Array.from(this.fileTransfers.values()).filter(transfer => transfer.userId === userId);
  }

  async createFileTransfer(transferData: any): Promise<FileTransfer> {
    const id = crypto.randomUUID();
    const transfer: FileTransfer = {
      ...transferData,
      id,
      createdAt: new Date()
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
    return Array.from(this.aiSuggestions.values()).filter(suggestion => suggestion.userId === userId);
  }

  async createAISuggestion(suggestionData: any): Promise<AiSuggestion> {
    const id = crypto.randomUUID();
    const suggestion: AiSuggestion = {
      ...suggestionData,
      id,
      createdAt: new Date()
    };
    this.aiSuggestions.set(id, suggestion);
    return suggestion;
  }

  async getBluetoothDevices(deviceId: string): Promise<BluetoothDevice[]> {
    return Array.from(this.bluetoothDevices.values()).filter(device => device.deviceId === deviceId);
  }

  async createBluetoothDevice(deviceData: any): Promise<BluetoothDevice> {
    const id = crypto.randomUUID();
    const device: BluetoothDevice = {
      ...deviceData,
      id,
      createdAt: new Date()
    };
    this.bluetoothDevices.set(id, device);
    return device;
  }

  async getVaultItems(userId: string): Promise<VaultItem[]> {
    return Array.from(this.vaultItems.values()).filter(item => item.userId === userId);
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
}

export const storage = new MemStorage();
