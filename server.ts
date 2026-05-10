import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieSession from 'cookie-session';
import multer from 'multer';
import { google } from 'googleapis';
import stream from 'stream';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const port = 3000;
app.set('trust proxy', 1);
app.set('strict routing', false);

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'dakshiksha-secret-key-v1'],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: true,
  httpOnly: true,
  sameSite: 'none'
}));

const isProd = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';
const isNetlify = process.env.NETLIFY === 'true' || !!process.env.LAMBDA_TASK_ROOT;

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// File upload setup
const upload = multer({
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_DRIVE_FOLDER_ID } = process.env;

    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_DRIVE_FOLDER_ID) {
      console.error('Missing Google Drive credentials:', {
        hasEmail: !!GOOGLE_CLIENT_EMAIL,
        hasKey: !!GOOGLE_PRIVATE_KEY,
        hasFolder: !!GOOGLE_DRIVE_FOLDER_ID
      });
      return res.status(500).json({ error: 'Google Drive credentials not configured' });
    }

    // Fix newlines in private key
    const privateKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^"|"$/g, '');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    const fileMetadata = {
      name: req.file.originalname,
      parents: [GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: req.file.mimetype,
      body: bufferStream,
    };

    console.log('Uploading file to Google Drive...');
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    console.log('File uploaded, making it public...');
    // Try to make the file public
    try {
      await drive.permissions.create({
        fileId: response.data.id!,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permError) {
      console.warn("Could not make file public (may be restricted by Workspace settings):", permError);
    }

    res.json({
      success: true,
      link: response.data.webViewLink,
      fileId: response.data.id
    });
  } catch (error) {
    console.error('Error uploading file to Drive:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to upload file to Google Drive' });
  }
});

// Final Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error Handler]:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    details: err.message || 'An unexpected error occurred on the server.'
  });
});

// Vite Middleware / Static Files
async function setupVite() {
  if (!isProd && !isVercel) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Standard Production Build Path
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA Fallback: Send index.html for all non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen on port if not in serverless environment
  if (!isVercel && !isNetlify) {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running at http://0.0.0.0:${port}`);
    });
  }
}

setupVite();

export default app;
