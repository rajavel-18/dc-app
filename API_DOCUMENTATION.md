# Campaign Management System API Documentation

## Overview
This API provides comprehensive campaign management functionality with targeting engine, CRUD operations, and metrics tracking.

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Campaign Endpoints

### 1. Create Campaign
**POST** `/campaigns`
- **Role Required**: Admin
- **Body**:
```json
{
  "stateId": 1,
  "dpdId": 5,
  "channelId": 1,
  "templateId": 1,
  "languageId": 1,
  "retries": 3,
  "retryIntervalMinutes": 60,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "filters": {
    "age_group": "25-35",
    "income_bracket": "50000-100000"
  }
}
```

### 2. Get All Campaigns
**GET** `/campaigns?page=1&limit=10&status=Active`
- **Role Required**: Admin, User
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `status` (optional): Filter by status

### 3. Get Campaign by ID
**GET** `/campaigns/:id`
- **Role Required**: Admin, User

### 4. Update Campaign
**PUT** `/campaigns/:id`
- **Role Required**: Admin
- **Body**: Same as create, all fields optional

### 5. Delete Campaign
**DELETE** `/campaigns/:id`
- **Role Required**: Admin

### 6. Get Campaign Metrics
**GET** `/campaigns/:id/metrics`
- **Role Required**: Admin, User

## Targeting Endpoints

### 1. Find Matching Campaigns
**POST** `/targeting/find-campaigns`
- **Role Required**: Admin, User
- **Body**:
```json
{
  "stateIds": [1, 2, 3],
  "dpdIds": [5, 6, 7],
  "channelIds": [1, 2],
  "templateIds": [1, 2],
  "languageIds": [1, 2],
  "customFilters": {
    "age_group": "25-35",
    "income_bracket": "50000-100000"
  }
}
```

### 2. Get Targeting Suggestions
**POST** `/targeting/suggestions`
- **Role Required**: Admin, User
- **Body**: Partial criteria (same structure as above, all fields optional)

### 3. Analyze Campaign Performance
**GET** `/targeting/campaign/:id/performance`
- **Role Required**: Admin, User

## Database Setup Commands

1. **Set up environment variables**:
```bash
# Create .env file with:
DATABASE_URL=postgresql://username:password@localhost:5432/cms_digital_collection
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

2. **Run database migrations**:
```bash
npm run db:migrate
```

3. **Seed initial data**:
```bash
# Seed admin user
npm run seed:admin

# Seed campaign reference data
npm run seed:campaigns
```

4. **Start the application**:
```bash
npm run start:dev
```

## Features Implemented

### ✅ Campaign Database Schema
- Complete schema with campaigns, filters, templates, and mapping tables
- Proper foreign key relationships
- Support for custom filters

### ✅ Campaign Service CRUD APIs
- Full CRUD operations with validation
- Auto-generated campaign names
- Reference validation
- Pagination support
- Role-based access control

### ✅ Targeting Engine
- Advanced filtering logic across state/DPD/channel
- Custom filter support
- Targeting suggestions
- Performance analytics
- Metrics calculation

### ✅ Validation & Security
- Input validation using class-validator
- JWT authentication
- Role-based authorization
- SQL injection protection

## Sample Campaign Creation Flow

1. **Create a campaign**:
```bash
curl -X POST http://localhost:3000/campaigns \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "stateId": 1,
    "dpdId": 5,
    "channelId": 1,
    "templateId": 1,
    "languageId": 1,
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "filters": {
      "age_group": "25-35"
    }
  }'
```

2. **Find matching campaigns**:
```bash
curl -X POST http://localhost:3000/targeting/find-campaigns \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "stateIds": [1, 2],
    "channelIds": [1]
  }'
```

## Next Steps for Production

1. **Connect to real analytics system** for metrics
2. **Implement customer database integration** for targeting
3. **Add campaign scheduling** functionality
4. **Implement A/B testing** capabilities
5. **Add comprehensive logging** and monitoring
6. **Set up automated testing** suite

