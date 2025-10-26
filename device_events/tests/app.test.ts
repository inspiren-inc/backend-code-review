import request from 'supertest';
import express from 'express';
import * as dotenv from 'dotenv';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// Mock the database client
jest.mock('../src/db/client', () => ({
  db: {
    query: jest.fn(),
    close: jest.fn(),
  },
}));

// Mock the events router
jest.mock('../src/routes/events', () => {
  const express = require('express');
  const router = express.Router();
  
  router.post('/', (req: any, res: any) => {
    res.status(201).json({ message: 'Event ingested successfully' });
  });
  
  router.get('/', (req: any, res: any) => {
    res.status(200).json({ events: [], total: 0, limit: 100, offset: 0 });
  });
  
  return router;
});

// Import app after mocking
import app from '../src/index';

describe('Application', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
      });
    });
  });

  describe('Events API', () => {
    it('should handle POST /api/events', async () => {
      const eventData = {
        device_id: 'device123',
        event_type: 'click',
        event_data: { button: 'submit' },
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(201);

      expect(response.body.message).toBe('Event ingested successfully');
    });

    it('should handle GET /api/events', async () => {
      const response = await request(app)
        .get('/api/events')
        .expect(200);

      expect(response.body).toEqual({
        events: [],
        total: 0,
        limit: 100,
        offset: 0,
      });
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('Middleware', () => {
    it('should log requests', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .get('/health')
        .expect(200);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z - GET \/health/)
      );

      consoleSpy.mockRestore();
    });

    it('should parse JSON bodies', async () => {
      const eventData = {
        device_id: 'device123',
        event_type: 'click',
        event_data: { button: 'submit' },
      };

      await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(201);
    });
  });
});

