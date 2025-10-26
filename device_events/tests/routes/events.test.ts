import request from 'supertest';
import express from 'express';
import eventsRouter from '../../src/routes/events';
import { db } from '../../src/db/client';

// Mock the database client
jest.mock('../../src/db/client', () => ({
  db: {
    query: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/events', eventsRouter);

describe('Events Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/events', () => {
    it('should create a new event successfully', async () => {
      const mockEvent = {
        id: 1,
        device_id: 'device123',
        event_type: 'click',
        event_data: { button: 'submit' },
        timestamp: new Date('2023-01-01T00:00:00Z'),
        created_at: new Date('2023-01-01T00:00:00Z'),
      };

      (db.query as jest.Mock).mockResolvedValue({
        rows: [mockEvent],
      });

      const eventData = {
        device_id: 'device123',
        event_type: 'click',
        event_data: { button: 'submit' },
        timestamp: '2023-01-01T00:00:00Z',
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(201);

      expect(response.body).toEqual({
        message: 'Event ingested successfully',
        event: mockEvent,
      });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO device_events'),
        ['device123', 'click', '{"button":"submit"}', new Date('2023-01-01T00:00:00Z')]
      );
    });

    it('should create event with current timestamp when not provided', async () => {
      const mockEvent = {
        id: 1,
        device_id: 'device123',
        event_type: 'click',
        event_data: { button: 'submit' },
        timestamp: expect.any(Date),
        created_at: expect.any(Date),
      };

      (db.query as jest.Mock).mockResolvedValue({
        rows: [mockEvent],
      });

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
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO device_events'),
        ['device123', 'click', '{"button":"submit"}', expect.any(Date)]
      );
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/events')
        .send({
          device_id: 'device123',
          // missing event_type and event_data
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields: device_id, event_type, event_data');
    });

    it('should return 400 for invalid event_data type', async () => {
      const response = await request(app)
        .post('/api/events')
        .send({
          device_id: 'device123',
          event_type: 'click',
          event_data: 'invalid', // should be object
        })
        .expect(400);

      expect(response.body.error).toBe('event_data must be a valid JSON object');
    });

    it('should return 400 for array event_data', async () => {
      const response = await request(app)
        .post('/api/events')
        .send({
          device_id: 'device123',
          event_type: 'click',
          event_data: ['invalid'], // should be object, not array
        })
        .expect(400);

      expect(response.body.error).toBe('event_data must be a valid JSON object');
    });

    it('should handle database errors', async () => {
      (db.query as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const eventData = {
        device_id: 'device123',
        event_type: 'click',
        event_data: { button: 'submit' },
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/events', () => {
    it('should return events with default pagination', async () => {
      const mockEvents = [
        {
          id: 1,
          device_id: 'device123',
          event_type: 'click',
          event_data: { button: 'submit' },
          timestamp: new Date('2023-01-01T00:00:00Z'),
          created_at: new Date('2023-01-01T00:00:00Z'),
        },
      ];

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }) // count query
        .mockResolvedValueOnce({ rows: mockEvents }); // data query

      const response = await request(app)
        .get('/api/events')
        .expect(200);

      expect(response.body).toEqual({
        events: mockEvents,
        total: 1,
        limit: 100,
        offset: 0,
      });
    });

    it('should filter by device_id', async () => {
      const mockEvents = [
        {
          id: 1,
          device_id: 'device123',
          event_type: 'click',
          event_data: { button: 'submit' },
          timestamp: new Date('2023-01-01T00:00:00Z'),
          created_at: new Date('2023-01-01T00:00:00Z'),
        },
      ];

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockEvents });

      await request(app)
        .get('/api/events?device_id=device123')
        .expect(200);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE device_id = $1'),
        ['device123']
      );
    });

    it('should filter by event_type', async () => {
      const mockEvents = [
        {
          id: 1,
          device_id: 'device123',
          event_type: 'click',
          event_data: { button: 'submit' },
          timestamp: new Date('2023-01-01T00:00:00Z'),
          created_at: new Date('2023-01-01T00:00:00Z'),
        },
      ];

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockEvents });

      await request(app)
        .get('/api/events?event_type=click')
        .expect(200);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE event_type = $1'),
        ['click']
      );
    });

    it('should filter by time range', async () => {
      const mockEvents = [
        {
          id: 1,
          device_id: 'device123',
          event_type: 'click',
          event_data: { button: 'submit' },
          timestamp: new Date('2023-01-01T00:00:00Z'),
          created_at: new Date('2023-01-01T00:00:00Z'),
        },
      ];

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockEvents });

      await request(app)
        .get('/api/events?start_time=2023-01-01T00:00:00Z&end_time=2023-01-02T00:00:00Z')
        .expect(200);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE timestamp >= $1 AND timestamp <= $2'),
        [new Date('2023-01-01T00:00:00Z'), new Date('2023-01-02T00:00:00Z')]
      );
    });

    it('should handle custom pagination', async () => {
      const mockEvents = [
        {
          id: 1,
          device_id: 'device123',
          event_type: 'click',
          event_data: { button: 'submit' },
          timestamp: new Date('2023-01-01T00:00:00Z'),
          created_at: new Date('2023-01-01T00:00:00Z'),
        },
      ];

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockEvents });

      const response = await request(app)
        .get('/api/events?limit=50&offset=10')
        .expect(200);

      expect(response.body).toEqual({
        events: mockEvents,
        total: 1,
        limit: 50,
        offset: 10,
      });
    });

    it('should limit maximum page size to 1000', async () => {
      const mockEvents = [
        {
          id: 1,
          device_id: 'device123',
          event_type: 'click',
          event_data: { button: 'submit' },
          timestamp: new Date('2023-01-01T00:00:00Z'),
          created_at: new Date('2023-01-01T00:00:00Z'),
        },
      ];

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockEvents });

      const response = await request(app)
        .get('/api/events?limit=2000')
        .expect(200);

      expect(response.body.limit).toBe(1000);
    });

    it('should handle database errors', async () => {
      (db.query as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/events')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });
  });
});

