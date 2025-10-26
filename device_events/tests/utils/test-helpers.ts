import { DeviceEvent, IngestEventRequest } from '../../src/types';

/**
 * Test helper functions for creating mock data
 */
export class TestHelpers {
  /**
   * Create a mock DeviceEvent
   */
  static createMockDeviceEvent(overrides: Partial<DeviceEvent> = {}): DeviceEvent {
    return {
      id: 1,
      device_id: 'test-device-123',
      event_type: 'click',
      event_data: { button: 'submit', page: 'home' },
      timestamp: new Date('2023-01-01T00:00:00Z'),
      created_at: new Date('2023-01-01T00:00:00Z'),
      ...overrides,
    };
  }

  /**
   * Create a mock IngestEventRequest
   */
  static createMockIngestRequest(overrides: Partial<IngestEventRequest> = {}): IngestEventRequest {
    return {
      device_id: 'test-device-123',
      event_type: 'click',
      event_data: { button: 'submit', page: 'home' },
      timestamp: '2023-01-01T00:00:00Z',
      ...overrides,
    };
  }

  /**
   * Create multiple mock events
   */
  static createMockEvents(count: number, baseOverrides: Partial<DeviceEvent> = {}): DeviceEvent[] {
    return Array.from({ length: count }, (_, index) => 
      this.createMockDeviceEvent({
        id: index + 1,
        device_id: `device-${index + 1}`,
        ...baseOverrides,
      })
    );
  }

  /**
   * Mock database query result
   */
  static createMockQueryResult(rows: any[] = [], rowCount: number = 0) {
    return {
      rows,
      rowCount,
      command: 'SELECT',
      oid: 0,
      fields: [],
    };
  }

  /**
   * Mock database count result
   */
  static createMockCountResult(count: number) {
    return this.createMockQueryResult([{ count: count.toString() }], 1);
  }

  /**
   * Wait for a specified amount of time
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a mock Express request
   */
  static createMockRequest(body: any = {}, query: any = {}, params: any = {}) {
    return {
      body,
      query,
      params,
      headers: {},
      method: 'GET',
      url: '/',
    };
  }

  /**
   * Create a mock Express response
   */
  static createMockResponse() {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
    return res;
  }
}

/**
 * Common test data
 */
export const TestData = {
  validEvent: {
    device_id: 'device-123',
    event_type: 'click',
    event_data: { button: 'submit', page: 'home' },
    timestamp: '2023-01-01T00:00:00Z',
  },
  
  invalidEvents: {
    missingDeviceId: {
      event_type: 'click',
      event_data: { button: 'submit' },
    },
    missingEventType: {
      device_id: 'device-123',
      event_data: { button: 'submit' },
    },
    missingEventData: {
      device_id: 'device-123',
      event_type: 'click',
    },
    invalidEventDataString: {
      device_id: 'device-123',
      event_type: 'click',
      event_data: 'invalid',
    },
    invalidEventDataArray: {
      device_id: 'device-123',
      event_type: 'click',
      event_data: ['invalid'],
    },
  },

  queryParams: {
    basic: {},
    withDeviceId: { device_id: 'device-123' },
    withEventType: { event_type: 'click' },
    withTimeRange: {
      start_time: '2023-01-01T00:00:00Z',
      end_time: '2023-01-02T00:00:00Z',
    },
    withPagination: { limit: '50', offset: '10' },
    withAllFilters: {
      device_id: 'device-123',
      event_type: 'click',
      start_time: '2023-01-01T00:00:00Z',
      end_time: '2023-01-02T00:00:00Z',
      limit: '50',
      offset: '10',
    },
  },
};

