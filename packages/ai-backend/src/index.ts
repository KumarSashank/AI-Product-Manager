/**
 * @fileoverview AI Backend Entry Point
 * @description Fastify server for AI extraction, MoM generation, and RAG
 *
 * This package is owned by: You (Kumar Sashank)
 * Responsibilities:
 * - Receive and store transcript streams from Bot Runner
 * - AI extraction of key information
 * - Minutes of Meeting (MoM) generation
 * - Task/progress tracking across recurring meetings
 * - RAG system for context retrieval
 */

import 'dotenv/config';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { API_CONFIG } from '@meeting-ai/shared';
import Fastify from 'fastify';

import { registerRoutes } from './routes/index.js';

function parseAllowedOrigins(): string[] {
  const configuredOrigins = [
    process.env.CORS_ALLOWED_ORIGINS,
    process.env.FRONTEND_ORIGIN,
    process.env.FRONTEND_URL,
  ]
    .flatMap((value) => (value ? value.split(',') : []))
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(
    new Set(['http://localhost:3000', 'http://localhost:3001', ...configuredOrigins])
  );
}

const server = Fastify({
  logger: true,
});

// Health check endpoint
server.get('/api/v1/health', async () => {
  return {
    status: 'healthy',
    version: '0.0.1',
    timestamp: new Date().toISOString(),
    services: ['database', 'meetings', 'transcripts', 'mom', 'items'],
  };
});

async function start(): Promise<void> {
  try {
    const allowedOrigins = parseAllowedOrigins();

    // Register CORS
    await server.register(cors, {
      origin: (origin, callback) => {
        // Allow Chrome extension origins and local network IPs for mobile testing
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          origin.startsWith('chrome-extension://') ||
          /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin)
        ) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });

    // Register WebSocket support (for audio streaming)
    await server.register(websocket);

    // Register all routes (routes already include /api/v1 prefix)
    await registerRoutes(server);

    const port = Number(process.env.PORT) || 3000;
    await server.listen({ port, host: '0.0.0.0' });
    console.warn(`AI Backend listening on http://localhost:${port}`);
    console.warn(`Timeout config: ${API_CONFIG.DEFAULT_TIMEOUT_MS}ms`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
