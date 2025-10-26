import { Router, Request, Response } from 'express';
import { db } from '../db/client';
import { IngestEventRequest, QueryEventsRequest, QueryEventsResponse } from '../types';

const router = Router();

// POST /api/events - Ingest a new device event
router.post('/', async (req: Request, res: Response) => {
  try {
    const { device_id, event_type, event_data, timestamp }: IngestEventRequest = req.body;

    // Validation
    if (!device_id || !event_type || !event_data) {
      return res.status(400).json({
        error: 'Missing required fields: device_id, event_type, event_data',
      });
    }

    if (typeof event_data !== 'object' || Array.isArray(event_data)) {
      return res.status(400).json({
        error: 'event_data must be a valid JSON object',
      });
    }

    const eventTimestamp = timestamp ? new Date(timestamp) : new Date();

    const result = await db.query(
      `INSERT INTO device_events (device_id, event_type, event_data, timestamp)
       VALUES ($1, $2, $3, $4)
       RETURNING id, device_id, event_type, event_data, timestamp, created_at`,
      [device_id, event_type, JSON.stringify(event_data), eventTimestamp]
    );

    return res.status(201).json({
      message: 'Event ingested successfully',
      event: result.rows[0],
    });
  } catch (error) {
    console.error('Error ingesting event:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// GET /api/events - Query device events
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      device_id,
      event_type,
      start_time,
      end_time,
      limit = '100',
      offset = '0',
    } = req.query as Record<string, string>;

    const queryLimit = Math.min(parseInt(limit) || 100, 1000);
    const queryOffset = parseInt(offset) || 0;

    // Build dynamic query
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (device_id) {
      conditions.push(`device_id = $${paramCount++}`);
      params.push(device_id);
    }

    if (event_type) {
      conditions.push(`event_type = $${paramCount++}`);
      params.push(event_type);
    }

    if (start_time) {
      conditions.push(`timestamp >= $${paramCount++}`);
      params.push(new Date(start_time));
    }

    if (end_time) {
      conditions.push(`timestamp <= $${paramCount++}`);
      params.push(new Date(end_time));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM device_events ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const dataQuery = `
      SELECT id, device_id, event_type, event_data, timestamp, created_at
      FROM device_events
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    const dataResult = await db.query(dataQuery, [...params, queryLimit, queryOffset]);

    const response: QueryEventsResponse = {
      events: dataResult.rows,
      total,
      limit: queryLimit,
      offset: queryOffset,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error querying events:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
