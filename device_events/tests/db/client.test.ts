import { Pool } from 'pg';

// Mock pg module
jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

describe('Database Client', () => {
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock pool
    mockPool = {
      query: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    } as any;

    // Mock Pool constructor
    (Pool as jest.MockedClass<typeof Pool>).mockImplementation(() => mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Pool Configuration', () => {
    it('should create a pool with correct configuration', () => {
      // Import after mocking to ensure the mock is used
      require('../../src/db/client');
      
      expect(Pool).toHaveBeenCalledWith({
        host: 'localhost',
        port: 5432,
        database: 'device_events_test',
        user: 'postgres',
        password: 'postgres',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });

    it('should set up error handler', () => {
      require('../../src/db/client');
      
      expect(mockPool.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Query Method', () => {
    it('should execute query successfully', async () => {
      const mockResult = {
        rows: [{ id: 1, name: 'test' }],
        rowCount: 1,
      };
      mockPool.query.mockResolvedValue(mockResult);

      // Import after mocking
      const { db } = require('../../src/db/client');
      
      const result = await db.query('SELECT * FROM test', ['param1']);

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM test', ['param1']);
      expect(result).toEqual(mockResult);
    });

    it('should handle query errors', async () => {
      const error = new Error('Database error');
      mockPool.query.mockRejectedValue(error);

      const { db } = require('../../src/db/client');
      
      await expect(db.query('SELECT * FROM test')).rejects.toThrow('Database error');
    });

    it('should log query execution time', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockResult = {
        rows: [{ id: 1 }],
        rowCount: 1,
      };
      mockPool.query.mockResolvedValue(mockResult);

      const { db } = require('../../src/db/client');
      
      await db.query('SELECT * FROM test');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Executed query',
        expect.objectContaining({
          text: 'SELECT * FROM test',
          duration: expect.any(Number),
          rows: 1,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Close Method', () => {
    it('should close the pool', async () => {
      mockPool.end.mockResolvedValue();

      const { db } = require('../../src/db/client');
      
      await db.close();

      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should handle close errors', async () => {
      const error = new Error('Close error');
      mockPool.end.mockRejectedValue(error);

      const { db } = require('../../src/db/client');
      
      await expect(db.close()).rejects.toThrow('Close error');
    });
  });
});