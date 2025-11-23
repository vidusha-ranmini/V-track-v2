# User Activity Logging Setup Instructions

## Overview
This system tracks user activities (especially login/logout) and stores them in the database for later viewing. The logs are only shown when needed and include filtering capabilities.

## Files Added/Modified

### New Files:
1. `user_activity_logs_schema.sql` - Database schema for activity logs
2. `v-track/src/lib/activityLogger.ts` - Server-side activity logging utility
3. `v-track/src/lib/clientActivityLogger.ts` - Client-side activity logging helper
4. `v-track/src/app/api/activity-logs/route.ts` - API endpoint for activity logs
5. `v-track/src/components/dashboard/ActivityLogs.tsx` - React component to display logs

### Modified Files:
1. `lib/supabaseClient.ts` - Added UserActivityLog interface
2. `v-track/src/app/api/auth/login/route.ts` - Added login activity logging
3. `v-track/src/lib/auth.ts` - Added logout activity logging
4. `database_schema.sql` - Added activity logs table

## Setup Steps

### 1. Database Setup
Run the activity logs table creation in your Supabase SQL editor:

```sql
-- Copy and paste the contents of user_activity_logs_schema.sql
-- OR run the updated database_schema.sql file
```

### 2. Environment Variables
Make sure your `.env.local` file has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

### 3. Test the Logging System

#### Test Login Logging:
1. Login to your application
2. Check the `user_activity_logs` table in Supabase
3. You should see login entries with IP address and user agent

#### Test Activity Logs API:
```bash
# Get all activity logs (requires admin token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/activity-logs"

# Get recent logins only
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/activity-logs?recent_logins=true&limit=10"

# Filter by action type
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/activity-logs?action_type=login"
```

## Using the Activity Logging System

### 1. Server-side Logging (API Routes)
```typescript
import { logUserActivity, getClientIP, getUserAgent } from '../../../lib/activityLogger';

// In your API route
await logUserActivity({
  username: 'admin',
  action_type: 'create',
  resource_type: 'member',
  resource_id: newMember.id,
  description: 'Created new member',
  ip_address: getClientIP(request),
  user_agent: getUserAgent(request),
  metadata: { member_name: newMember.full_name }
});
```

### 2. Client-side Logging (React Components)
```typescript
import { ActivityLogger } from '../lib/clientActivityLogger';

// Log when user creates something
const handleCreate = async () => {
  const result = await createSomething();
  await ActivityLogger.logCreate('member', result.id, 'Created new member');
};

// Log when user views something
useEffect(() => {
  if (itemId) {
    ActivityLogger.logView('member', itemId);
  }
}, [itemId]);
```

### 3. Display Activity Logs in Dashboard
```typescript
import ActivityLogs from '../components/dashboard/ActivityLogs';

// Show recent login activities only
<ActivityLogs showRecentLogsOnly={true} maxItems={5} />

// Show full activity logs with filtering
<ActivityLogs />
```

## Features

### 1. Activity Types Supported:
- `login` - User login attempts (success/failure)
- `logout` - User logout
- `create` - Creating new resources
- `update` - Updating existing resources  
- `delete` - Deleting resources
- `view` - Viewing specific resources
- `export` - Exporting data

### 2. Logged Information:
- Username
- Action type and description
- Resource type and ID (if applicable)
- IP address and User Agent
- Timestamp
- Custom metadata (JSON)

### 3. Viewing Options:
- Recent logins only (for dashboard summary)
- Full activity logs with filtering by:
  - Username
  - Action type
  - Resource type
  - Date range
- Pagination support
- Real-time refresh

### 4. Security Features:
- Admin-only access to view logs
- Row Level Security (RLS) enabled
- Automatic IP and User Agent capture
- Failed login attempt tracking

## Customization

### Add New Activity Types:
1. Update the CHECK constraint in the database
2. Update the TypeScript interfaces
3. Add new logging calls where needed

### Add Resource-Specific Logging:
```typescript
// Example: Log when viewing household details
ActivityLogger.logView('household', householdId, 'Viewed household details', {
  address: household.address,
  member_count: household.members.length
});
```

### Custom Metadata:
```typescript
await logUserActivity({
  username: 'admin',
  action_type: 'export',
  resource_type: 'members',
  description: 'Exported member list to CSV',
  metadata: {
    export_format: 'csv',
    record_count: 150,
    filters_applied: { road_id: 'abc-123' }
  }
});
```

## Performance Considerations

1. **Async Logging**: All logging is done asynchronously to not block user operations
2. **Indexed Queries**: Database indexes on username, action_type, created_at, and resource fields
3. **Pagination**: Large result sets are paginated
4. **Selective Display**: Show logs only when needed, not on every page

## Monitoring

Check the browser console and server logs for activity logging status:
- `✅ User activity logged successfully`
- `❌ Failed to log user activity`
- `📝 Logging user activity: {details}`

The system is designed to fail gracefully - if logging fails, it won't break the main functionality.