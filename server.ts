import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Google OAuth Configuration
  const REDIRECT_URI = `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`;
  console.log('Google OAuth Redirect URI:', REDIRECT_URI);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // OAuth URL endpoint
  app.get('/api/auth/google/url', (req, res) => {
    console.log('Generating Google Auth URL with Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ],
      prompt: 'consent'
    });
    res.json({ url });
  });

  // OAuth Callback
  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      // In a real app, you'd store tokens in a database associated with the user
      // For this demo, we'll send them back to the client to store in localStorage (not secure for production!)
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  tokens: ${JSON.stringify(tokens)} 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Autenticação bem-sucedida. Esta janela fechará automaticamente.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      res.status(500).send('Authentication failed');
    }
  });

  // Google Calendar Sync Endpoint
  app.post('/api/calendar/sync', async (req, res) => {
    const { tokens, capture } = req.body;
    if (!tokens) return res.status(401).json({ error: 'Not authenticated' });

    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      const event = {
        summary: capture.title,
        location: capture.location,
        description: `Captação OMEGA - Contato: ${capture.clientContact}`,
        start: {
          dateTime: capture.startDateTime, // ISO string
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: capture.endDateTime, // ISO string
          timeZone: 'America/Sao_Paulo',
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      res.json({ success: true, eventId: response.data.id });
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
      res.status(500).json({ error: 'Sync failed' });
    }
  });

  // Google Drive: Create Folder
  app.post('/api/drive/folder', async (req, res) => {
    const { tokens, folderName } = req.body;
    if (!tokens) return res.status(401).json({ error: 'Not authenticated' });

    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };
      const file = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });
      res.json({ success: true, folderId: file.data.id });
    } catch (error) {
      console.error('Error creating Drive folder:', error);
      res.status(500).json({ error: 'Folder creation failed' });
    }
  });

  // Google Drive: Delete Folder
  app.delete('/api/drive/folder/:id', async (req, res) => {
    const { tokens } = req.body;
    const { id } = req.params;
    if (!tokens) return res.status(401).json({ error: 'Not authenticated' });

    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    try {
      await drive.files.delete({ fileId: id });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting Drive folder:', error);
      res.status(500).json({ error: 'Folder deletion failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
