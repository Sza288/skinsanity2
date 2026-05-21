import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Lazy initialize GoogleGenAI to prevent crashes upon startup if the key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not defined out-of-the-box. Please check your secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', hasApiKey: !!process.env.GEMINI_API_KEY });
  });

  // Skincare AI Assistant Endpoint (lazy loaded, robust error handling)
  app.post('/api/skincare-ai', async (req: Request, res: Response) => {
    try {
      const { message, products, history } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const client = getAiClient();

      // Build skincare inventory summary context to supply to the system instruction
      const productSummary = (products || [])
        .map((p: any) => {
          return `- [${p.brand}] ${p.name} (${p.category}): Expires ${p.expiryDate}, ${p.remainingPercent}% left, Routine: ${p.assignedRoutine}, Concerns: ${p.skinConcerns.join(', ')}. PAO: ${p.paoMonths || 'N/A'}mo. Open Date: ${p.openDate || 'N/A'}`;
        })
        .join('\n');

      const systemInstruction = `
You are GlowAdvisor, an interactive, world-class cosmetic scientist, dermatologist, and skincare specialist. 
Your tone is professional, warm, encouraging, scientific, and realistic. Avoid buzzwords and hype. Focus on scientific backing, gentle barrier care, and active ingredient compatibility.

You have access to the user's current skincare shelf inventory:
---
${productSummary || 'No items currently in they skincare collection.'}
---

Guidelines:
1. Always analyze interactions. For example, warn them about over-exfoliation if they use high concentrations of AHAs/BHAs (like the Avoskin Refining Toner) with retinoids or other strong irritants in the same routine stage.
2. Promote standard skincare rules: apply thinnest (watery) formulas first, then thicker creams. Sunscreen is ALWAYS the final step of AM routines. Never put exfoliating acids on in the morning without stressing mandatory high SPF sunscreen use.
3. Keep answers concise, visually formatted with headings/bullet points, and extremely structured so they read beautifully on a client UI.
4. If they have no products yet, help them build a basic "Cleanser -> Moisturizer -> Sunscreen" foundation first.
5. Emphasize Period After Opening (PAO) safety, checking for expired products (e.g., May 2025 has expired or is expiring depends on current year 2026).
`;

      // Format history into contents structure expected by generateContent
      // Let's build content parts
      const contents = [];
      
      // Inject prior history
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }
      }
      
      // Inject the current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text || "I couldn't generate a response. Please try again.";
      res.json({ text });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({
        error: error?.message || 'Failed to connect to the AI advisor. Please verify your GEMINI_API_KEY in the Secrets panel.'
      });
    }
  });

  // Enable Vite middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running in DEVELOPMENT mode. Mounting Vite...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Running in PRODUCTION mode. Serving static assets...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express dev server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
