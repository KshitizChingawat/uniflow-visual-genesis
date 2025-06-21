import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertDeviceSchema, insertClipboardSchema, insertFileTransferSchema, insertAiSuggestionSchema } from "@shared/schema";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      
      res.json({ user: { id: user.id, email: user.email }, token });
    } catch (error) {
      res.status(400).json({ error: 'Invalid user data' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      
      res.json({ user: { id: user.id, email: user.email }, token });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Device management routes
  app.get('/api/devices', authenticateToken, async (req: any, res) => {
    try {
      const devices = await storage.getDevicesByUserId(req.user.userId);
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch devices' });
    }
  });

  app.post('/api/devices', authenticateToken, async (req: any, res) => {
    try {
      const deviceData = { ...req.body, userId: req.user.userId };
      const device = await storage.createDevice(deviceData);
      res.json(device);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create device' });
    }
  });

  app.patch('/api/devices/:id', authenticateToken, async (req: any, res) => {
    try {
      const device = await storage.updateDevice(req.params.id, req.body);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      res.json(device);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update device' });
    }
  });

  app.delete('/api/devices/:id', authenticateToken, async (req: any, res) => {
    try {
      const success = await storage.deleteDevice(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Device not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Failed to delete device' });
    }
  });

  // Clipboard management routes
  app.get('/api/clipboard', authenticateToken, async (req: any, res) => {
    try {
      const items = await storage.getClipboardItems(req.user.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch clipboard items' });
    }
  });

  app.post('/api/clipboard', authenticateToken, async (req: any, res) => {
    try {
      const clipboardData = { 
        ...req.body, 
        userId: req.user.userId,
        syncTimestamp: new Date().toISOString()
      };
      const item = await storage.createClipboardItem(clipboardData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create clipboard item' });
    }
  });

  app.delete('/api/clipboard/:id', authenticateToken, async (req: any, res) => {
    try {
      const success = await storage.deleteClipboardItem(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Clipboard item not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Failed to delete clipboard item' });
    }
  });

  // File transfer routes
  app.get('/api/file-transfers', authenticateToken, async (req: any, res) => {
    try {
      const transfers = await storage.getFileTransfers(req.user.userId);
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch file transfers' });
    }
  });

  app.post('/api/file-transfers', authenticateToken, async (req: any, res) => {
    try {
      // Handle JSON request with proper field names
      const fileName = req.body.fileName || 'Unknown';
      const fileSize = req.body.fileSize || 0;
      const fileType = req.body.fileType || 'application/octet-stream';
      const senderDeviceId = req.body.senderDeviceId;
      const receiverDeviceId = req.body.receiverDeviceId;
      const transferMethod = req.body.transferMethod || 'cloud';

      const transferData = {
        userId: req.user.userId,
        senderDeviceId,
        receiverDeviceId,
        fileName,
        fileSize,
        fileType,
        transferStatus: 'in_progress',
        transferMethod
      };
      
      const transfer = await storage.createFileTransfer(transferData);
      
      // Simulate transfer completion after a short delay
      setTimeout(async () => {
        try {
          await storage.updateFileTransfer(transfer.id, { 
            transferStatus: 'completed',
            completedAt: new Date().toISOString()
          });
        } catch (err) {
          console.error('Failed to update transfer status:', err);
        }
      }, 2000);
      
      res.json(transfer);
    } catch (error) {
      console.error('File transfer error:', error);
      res.status(400).json({ error: 'Failed to create file transfer' });
    }
  });

  app.patch('/api/file-transfers/:id', authenticateToken, async (req: any, res) => {
    try {
      const transfer = await storage.updateFileTransfer(req.params.id, req.body);
      if (!transfer) {
        return res.status(404).json({ error: 'Transfer not found' });
      }
      res.json(transfer);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update file transfer' });
    }
  });

  app.get('/api/file-transfers/:id/download', authenticateToken, async (req: any, res) => {
    try {
      // Simulate file download
      const transfer = await storage.getFileTransfer(req.params.id);
      if (!transfer) {
        return res.status(404).json({ error: 'Transfer not found' });
      }
      
      // In a real implementation, you would serve the actual file
      res.setHeader('Content-Disposition', `attachment; filename="${transfer.fileName}"`);
      res.setHeader('Content-Type', transfer.fileType || 'application/octet-stream');
      res.send('Sample file content for demo purposes');
    } catch (error) {
      res.status(500).json({ error: 'Failed to download file' });
    }
  });

  // AI suggestions routes
  app.get('/api/ai-suggestions', authenticateToken, async (req: any, res) => {
    try {
      const suggestions = await storage.getAISuggestions(req.user.userId);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch AI suggestions' });
    }
  });

  app.post('/api/ai-assistant', authenticateToken, async (req: any, res) => {
    try {
      const { content, type, context } = req.body;
      const openaiApiKey = process.env.OPENAI_API_KEY;
      
      if (!openaiApiKey) {
        // Provide mock AI suggestions when API key is not available
        const mockSuggestions = {
          clipboard_analysis: {
            category: content.includes('http') ? 'url' : 'text',
            actions: ['Save to notes', 'Share with team', 'Create reminder'],
            summary: `Analyzed clipboard content: ${content.substring(0, 50)}...`,
            confidence: 0.8
          },
          file_organization: {
            category: 'documents',
            suggested_folder: 'Downloads',
            tags: ['recent', 'document'],
            auto_actions: ['organize', 'backup'],
            confidence: 0.7
          },
          device_recommendation: {
            recommended_device: context?.devices?.[0]?.id || 'current',
            reason: 'Best suited for this task based on device capabilities',
            confidence: 0.9,
            alternative: context?.devices?.[1]?.id || 'current'
          }
        };

        const mockResponse = mockSuggestions[type as keyof typeof mockSuggestions] || {
          suggestion: "AI functionality requires API key setup",
          confidence: 0.5
        };

        const suggestion = await storage.createAISuggestion({
          userId: req.user.userId,
          suggestionType: type,
          content: mockResponse,
          confidenceScore: mockResponse.confidence || 0.5
        });

        return res.json({ 
          success: true, 
          suggestion: mockResponse, 
          suggestion_id: suggestion.id,
          confidenceScore: mockResponse.confidence || 0.5
        });
      }
      
      let prompt = '';
      switch (type) {
        case 'clipboard_analysis':
          prompt = `Analyze this clipboard content and provide smart suggestions for actions or categorization: "${content}". Return JSON with: {"category": "text|url|email|phone|address|code|other", "actions": ["action1", "action2"], "summary": "brief description", "confidence": 0.8}`;
          break;
        case 'file_organization':
          prompt = `Suggest optimal organization for this file: "${content}". Consider file type, name, and context: ${JSON.stringify(context)}. Return JSON with: {"category": "documents|media|code|archive|other", "suggested_folder": "folder_name", "tags": ["tag1", "tag2"], "auto_actions": ["action1", "action2"], "confidence": 0.8}`;
          break;
        case 'device_recommendation':
          prompt = `Based on this task context: "${content}" and available devices: ${JSON.stringify(context.devices)}, recommend the best device. Return JSON with: {"recommended_device": "device_id", "reason": "explanation", "confidence": 0.9, "alternative": "device_id"}`;
          break;
        default:
          throw new Error('Invalid AI request type');
      }

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant for UniLink, a cross-device productivity app. Provide helpful, concise suggestions in valid JSON format only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error('OpenAI API request failed');
      }

      const openaiData = await openaiResponse.json();
      const aiResponse = openaiData.choices[0].message.content;

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiResponse);
      } catch (e) {
        parsedResponse = { suggestion: aiResponse, raw: true, confidence: 0.5 };
      }

      const confidenceScore = parsedResponse.confidence || 0.8;
      
      const suggestion = await storage.createAISuggestion({
        userId: req.user.userId,
        suggestionType: type,
        content: parsedResponse,
        confidenceScore
      });
      
      res.json({ success: true, suggestion: parsedResponse, suggestion_id: suggestion.id, confidenceScore });
    } catch (error) {
      console.error('AI assistant error:', error);
      res.status(500).json({ error: 'AI assistant failed' });
    }
  });

  app.patch('/api/ai-suggestions/:id', authenticateToken, async (req: any, res) => {
    try {
      const suggestion = await storage.updateAISuggestion(req.params.id, req.body);
      if (!suggestion) {
        return res.status(404).json({ error: 'Suggestion not found' });
      }
      res.json(suggestion);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update suggestion' });
    }
  });

  app.post('/api/ai-suggestions/:id/feedback', authenticateToken, async (req: any, res) => {
    try {
      const { feedback_score } = req.body;
      const suggestion = await storage.updateAISuggestion(req.params.id, {
        feedback_score,
        feedback_timestamp: new Date().toISOString()
      });
      
      if (!suggestion) {
        return res.status(404).json({ error: 'Suggestion not found' });
      }
      
      res.json({ success: true, suggestion });
    } catch (error) {
      res.status(400).json({ error: 'Failed to provide feedback' });
    }
  });

  app.delete('/api/ai-suggestions/:id', authenticateToken, async (req: any, res) => {
    try {
      const success = await storage.deleteAISuggestion(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Suggestion not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Failed to delete suggestion' });
    }
  });

  // Secure vault routes
  app.get('/api/vault', authenticateToken, async (req: any, res) => {
    try {
      const items = await storage.getVaultItems(req.user.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch vault items' });
    }
  });

  app.post('/api/vault', authenticateToken, async (req: any, res) => {
    try {
      const vaultData = { ...req.body, userId: req.user.userId };
      const item = await storage.createVaultItem(vaultData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create vault item' });
    }
  });

  app.delete('/api/vault/:id', authenticateToken, async (req: any, res) => {
    try {
      const success = await storage.deleteVaultItem(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Vault item not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Failed to delete vault item' });
    }
  });

  // User preferences routes
  app.patch('/api/user/preferences', authenticateToken, async (req: any, res) => {
    try {
      const preferences = await storage.updateUserPreferences(req.user.userId, req.body);
      res.json({ success: true, preferences });
    } catch (error) {
      res.status(400).json({ error: 'Failed to update preferences' });
    }
  });

  // Sync trigger route
  app.post('/api/sync/trigger', authenticateToken, async (req: any, res) => {
    try {
      // Simulate manual sync completion
      res.json({ success: true, message: 'Sync completed', timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: 'Sync failed' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}