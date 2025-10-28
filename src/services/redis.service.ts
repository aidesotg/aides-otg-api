import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface LocationUpdate {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp?: number;
}

export interface NearbySearchResult {
  userId: string;
  distance: number; // in kilometers
  coordinates: [number, number]; // [longitude, latitude]
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    // Test connection
    await this.client.ping();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Update caregiver's live location using Redis GEO commands
   * Uses GEOADD to store latitude and longitude
   */
  async updateCaregiverLocation(location: LocationUpdate): Promise<void> {
    const { userId, latitude, longitude } = location;
    const key = 'caregiver:locations';

    // Add or update location in sorted set with GEOADD
    await this.client.geoadd(key, longitude, latitude, userId);

    // Also store timestamp for tracking last update
    await this.client.set(
      `caregiver:${userId}:last_update`,
      Date.now().toString(),
    );
  }

  /**
   * Get nearby caregivers within a specified radius
   * @param latitude - Center latitude
   * @param longitude - Center longitude
   * @param radius - Radius in km
   * @param unit - Unit of measurement (m = meters, km = kilometers, mi = miles, ft = feet)
   * @returns Array of nearby caregivers with distances
   */
  async findNearbyCaregivers(
    latitude: number,
    longitude: number,
    radius: number = 5,
    unit: 'm' | 'km' | 'mi' | 'ft' = 'km',
  ): Promise<NearbySearchResult[]> {
    const key = 'caregiver:locations';

    // Use GEORADIUS to find nearby caregivers
    const results = await this.client.georadius(
      key,
      longitude,
      latitude,
      radius,
      unit,
      'WITHDIST',
      'WITHCOORD',
      'ASC',
    );

    // Parse results
    const caregivers: NearbySearchResult[] = [];

    for (const result of results as any[]) {
      if (Array.isArray(result)) {
        const userId = result[0];
        const distance = parseFloat(result[1]);
        const [longitude, latitude] = result[2];

        caregivers.push({
          userId,
          distance,
          coordinates: [longitude, latitude],
        });
      }
    }

    return caregivers;
  }

  /**
   * Get distance between two specific caregivers
   * @param caregiverId1 - First caregiver ID
   * @param caregiverId2 - Second caregiver ID
   * @returns Distance in kilometers, or null if either not found
   */
  async getDistanceBetween(
    caregiverId1: string,
    caregiverId2: string,
    unit: 'm' | 'km' | 'mi' | 'ft' = 'km',
  ): Promise<number | null> {
    const key = 'caregiver:locations';

    const distance = await (this.client as any).geodist(
      key,
      caregiverId1,
      caregiverId2,
      unit,
    );

    if (distance === null || distance === undefined) {
      return null;
    }

    return typeof distance === 'string' ? parseFloat(distance) : distance;
  }

  /**
   * Get specific caregiver's location
   * @param caregiverId - Caregiver ID
   * @returns Coordinates [longitude, latitude] or null
   */
  async getCaregiverLocation(
    caregiverId: string,
  ): Promise<[number, number] | null> {
    const key = 'caregiver:locations';

    const location = await this.client.geopos(key, caregiverId);

    if (!location || location.length === 0 || !location[0]) {
      return null;
    }

    const coord = location[0];
    if (!coord || !Array.isArray(coord) || coord.length < 2) {
      return null;
    }

    const [longitude, latitude] = [parseFloat(coord[0]), parseFloat(coord[1])];
    return [longitude, latitude];
  }

  /**
   * Remove caregiver location (e.g., when they go offline)
   */
  async removeCaregiverLocation(caregiverId: string): Promise<void> {
    const key = 'caregiver:locations';
    await this.client.zrem(key, caregiverId);
    await this.client.del(`caregiver:${caregiverId}:last_update`);
  }

  /**
   * Check if caregiver is online (location exists and recently updated)
   * @param caregiverId - Caregiver ID
   * @param maxAge - Maximum age in seconds (default 10 minutes)
   */
  async isCaregiverOnline(
    caregiverId: string,
    maxAge: number = 600,
  ): Promise<boolean> {
    const lastUpdate = await this.client.get(
      `caregiver:${caregiverId}:last_update`,
    );

    if (!lastUpdate) {
      return false;
    }

    const now = Date.now();
    const age = (now - parseInt(lastUpdate)) / 1000; // age in seconds

    return age <= maxAge;
  }

  /**
   * Get all online caregivers (with recent location updates)
   */
  async getAllOnlineCaregivers(maxAge: number = 600): Promise<string[]> {
    const key = 'caregiver:locations';
    const allCaregivers = await this.client.zrange(key, 0, -1);

    const onlineCaregivers: string[] = [];

    for (const caregiverId of allCaregivers) {
      const isOnline = await this.isCaregiverOnline(caregiverId, maxAge);
      if (isOnline) {
        onlineCaregivers.push(caregiverId);
      }
    }

    return onlineCaregivers;
  }

  /**
   * Update client's location for a service request
   */
  async updateClientLocationForRequest(
    requestId: string,
    latitude: number,
    longitude: number,
  ): Promise<void> {
    const key = `request:${requestId}:location`;

    // Store location
    await this.client.set(`${key}:lat`, latitude.toString());
    await this.client.set(`${key}:lng`, longitude.toString());
    await this.client.set(`${key}:timestamp`, Date.now().toString());
  }

  /**
   * Get client location for a service request
   */
  async getClientLocationForRequest(
    requestId: string,
  ): Promise<{ latitude: number; longitude: number } | null> {
    const key = `request:${requestId}:location`;

    const lat = await this.client.get(`${key}:lat`);
    const lng = await this.client.get(`${key}:lng`);

    if (!lat || !lng) {
      return null;
    }

    return {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
    };
  }

  /**
   * Calculate distance between a caregiver and a service request location
   */
  async calculateDistanceToRequest(
    caregiverId: string,
    requestId: string,
  ): Promise<number | null> {
    const clientLocation = await this.getClientLocationForRequest(requestId);

    if (!clientLocation) {
      return null;
    }

    const caregiverLocation = await this.getCaregiverLocation(caregiverId);

    if (!caregiverLocation) {
      return null;
    }

    // Calculate distance using Redis GEODIST with stored coordinates
    const key = 'caregiver:locations';

    // Temporarily add client location to calculate distance
    const tempKey = `temp:${requestId}`;
    await this.client.geoadd(
      tempKey,
      clientLocation.longitude,
      clientLocation.latitude,
      requestId,
    );

    const distance = await (this.client as any).geodist(
      key,
      caregiverId,
      requestId,
      'km',
    );

    // Clean up temporary location
    await this.client.del(tempKey);

    return distance
      ? typeof distance === 'string'
        ? parseFloat(distance)
        : distance
      : null;
  }

  /**
   * Search for caregivers within radius of a service request
   * @param requestId - Service request ID
   * @param radius - Radius in km
   * @returns Array of caregivers sorted by distance
   */
  async findCaregiversNearRequest(
    requestId: string,
    radius: number = 10,
  ): Promise<NearbySearchResult[]> {
    const clientLocation = await this.getClientLocationForRequest(requestId);

    if (!clientLocation) {
      return [];
    }

    return this.findNearbyCaregivers(
      clientLocation.latitude,
      clientLocation.longitude,
      radius,
    );
  }

  /**
   * Remove request location when request is completed/cancelled
   */
  async removeRequestLocation(requestId: string): Promise<void> {
    const key = `request:${requestId}:location`;
    await this.client.del(`${key}:lat`, `${key}:lng`, `${key}:timestamp`);
  }

  /**
   * Generic Redis get
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * Generic Redis set
   */
  async set(key: string, value: string, expiration?: number): Promise<void> {
    if (expiration) {
      await this.client.setex(key, expiration, value);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Generic Redis delete
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Check if Redis is connected
   */
  async isConnected(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
}
