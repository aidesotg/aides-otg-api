# Redis Integration for Live Location Tracking

This document describes the Redis integration for live location updates, searching, and distance calculation between caregivers and clients in the Aides-otg application.

## Overview

Redis has been integrated to enable:

1. **Live location tracking** for caregivers
2. **Geospatial searching** to find nearby caregivers
3. **Distance calculation** between caregivers and service request locations

## Architecture

### Redis Service (`src/services/redis.service.ts`)

The Redis service provides comprehensive location tracking functionality:

#### Key Features:

- **Caregiver Location Management**: Store and update caregiver locations using Redis GEO commands
- **Nearby Search**: Find caregivers within a specified radius using `GEORADIUS`
- **Distance Calculation**: Calculate distances between points using `GEODIST`
- **Online Status**: Track caregiver online status based on recent location updates
- **Client Location Tracking**: Store client locations for service requests

#### Main Methods:

1. **updateCaregiverLocation()** - Update a caregiver's live location
2. **findNearbyCaregivers()** - Search for caregivers within a radius
3. **getDistanceBetween()** - Get distance between two caregivers
4. **findCaregiversNearRequest()** - Find caregivers near a specific service request
5. **calculateDistanceToRequest()** - Calculate distance from caregiver to request location
6. **isCaregiverOnline()** - Check if a caregiver is online

### Service Request Integration

The service request service has been updated to:

- Update caregiver location when they're "on the way"
- Store client locations for service requests
- Calculate distances between caregivers and clients
- Find nearby caregivers for service requests
- Clean up location data when services complete

## API Endpoints

### Location Tracking Endpoints

#### 1. Update Caregiver Location

```
POST /service-request/caregiver/location
Body: {
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

Updates the authenticated caregiver's current location.

#### 2. Find Nearby Caregivers

```
GET /service-request/nearby-caregivers?latitude=40.7128&longitude=-74.0060&radius=5
```

Returns caregivers within the specified radius (in km).

#### 3. Find Caregivers Near Request

```
GET /service-request/request/{requestId}/nearby-caregivers?radius=10
```

Returns caregivers near a specific service request location.

#### 4. Get Distance to Request

```
GET /service-request/request/{requestId}/distance/{caregiverId}
```

Calculates and returns the distance between a caregiver and a service request.

#### 5. Update Request Location

```
POST /service-request/request/{requestId}/location
Body: {
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

Stores the location for a service request.

## Configuration

Add the following to your `.env` file:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional, leave empty for no password
```

## Data Structures

### Caregiver Locations

- **Redis Key**: `caregiver:locations`
- **Type**: Sorted Set (GEO data structure)
- **Value**: User ID
- **Score**: Longitude, Latitude (encoded by Redis GEO)

### Request Locations

- **Redis Key**: `request:{requestId}:location`
- **Stored Values**:
  - `request:{requestId}:location:lat` - Latitude
  - `request:{requestId}:location:lng` - Longitude
  - `request:{requestId}:location:timestamp` - Timestamp

### Last Update Tracking

- **Redis Key**: `caregiver:{userId}:last_update`
- **Value**: Timestamp of last location update

## Usage Examples

### Updating Caregiver Location

When a caregiver app sends periodic location updates:

```typescript
await this.serviceRequestService.updateCaregiverLocation(userId, {
  latitude: 40.7128,
  longitude: -74.006,
});
```

### Finding Nearby Caregivers

When a client creates a service request:

```typescript
// Store the request location
await this.serviceRequestService.updateRequestLocation(requestId, {
  latitude: 40.7128,
  longitude: -74.006,
});

// Find nearby caregivers within 10km
const nearbyCaregivers =
  await this.serviceRequestService.findCaregiversNearRequest(
    requestId,
    10, // radius in km
  );
```

### Calculating Distance

Check how far a caregiver is from a request:

```typescript
const distance = await this.serviceRequestService.getCaregiverDistance(
  requestId,
  caregiverId,
);
// Returns: { status: 'success', data: { distance: 2.5, unit: 'km' } }
```

## Automatic Cleanup

The system automatically:

- Updates caregiver locations when they update their activity trail to "on_my_way"
- Cleans up location data when a service is marked as "completed"
- Tracks online status based on recent location updates (default: 10 minutes)

## Performance Considerations

- **Real-time Updates**: Location updates are stored in Redis for fast geospatial queries
- **Efficient Search**: Uses Redis GEORADIUS which is optimized for proximity searches
- **Fast Distance Calculations**: Redis GEODIST provides O(log(N)) distance calculations
- **Memory Efficiency**: Redis GEO structures are memory-efficient for large datasets

## Future Enhancements

Potential improvements:

- WebSocket integration for real-time location streaming
- Historical location tracking for analytics
- Geofencing for automatic status updates
- Route optimization using shortest path algorithms
- Batch location updates for multiple caregivers

## Dependencies

- `ioredis`: Redis client for Node.js
- Redis server (6.2+ recommended for best GEO command support)

## Testing

To test the integration:

1. Start Redis: `redis-server`
2. Start the application: `npm run start:dev`
3. Use the API endpoints to update locations and search for nearby caregivers

## Troubleshooting

### Connection Issues

If Redis connection fails, check:

- Redis server is running: `redis-cli ping`
- Environment variables are set correctly
- Firewall rules allow Redis port

### Location Not Found

If searches return no results:

- Verify locations are being updated
- Check that caregivers are within the search radius
- Ensure coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)
