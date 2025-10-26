export interface DeviceEvent {
  id?: number;
  device_id: string;
  event_type: string;
  event_data: Record<string, any>;
  timestamp?: Date;
  created_at?: Date;
}

export interface IngestEventRequest {
  device_id: string;
  event_type: string;
  event_data: Record<string, any>;
  timestamp?: string;
}

export interface QueryEventsRequest {
  device_id?: string;
  event_type?: string;
  start_time?: string;
  end_time?: string;
  limit?: number;
  offset?: number;
}

export interface QueryEventsResponse {
  events: DeviceEvent[];
  total: number;
  limit: number;
  offset: number;
}
