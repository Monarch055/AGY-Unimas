import http from 'node:http';
import next from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';

const app = next({
  dev: false,
  dir: __dirname,
  hostname,
  port,
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  server.listen(port, hostname, () => {
    console.log(`[RekaSains Web] Production server listening at http://${hostname}:${port}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}).catch((err) => {
  console.error('[RekaSains Web] Failed to start server:', err);
  process.exit(1);
});
