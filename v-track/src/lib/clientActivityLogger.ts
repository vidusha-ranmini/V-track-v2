// Client-side activity logging helper
// Use this in React components to log user activities

import { verifyToken } from './auth';

interface ClientActivityLogData {
  action_type: 'create' | 'update' | 'delete' | 'view' | 'export';
  resource_type?: string;
  resource_id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log user activity from client-side
 * This function automatically gets the username from the auth token
 */
export async function logClientActivity(data: ClientActivityLogData): Promise<boolean> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No auth token found, cannot log activity');
      return false;
    }

    const user = verifyToken(token);
    if (!user) {
      console.warn('Invalid auth token, cannot log activity');
      return false;
    }

    const response = await fetch('/api/activity-logs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: user.username,
        ...data,
        metadata: {
          ...data.metadata,
          client_logged: true,
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      console.error('Failed to log activity:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error logging client activity:', error);
    return false;
  }
}

// Convenience functions for common activities

export const ActivityLogger = {
  /**
   * Log when user views a specific resource
   */
  logView: (resourceType: string, resourceId: string, description?: string) => {
    return logClientActivity({
      action_type: 'view',
      resource_type: resourceType,
      resource_id: resourceId,
      description: description || `Viewed ${resourceType} ${resourceId}`
    });
  },

  /**
   * Log when user creates a new resource
   */
  logCreate: (resourceType: string, resourceId: string, description?: string, metadata?: Record<string, unknown>) => {
    return logClientActivity({
      action_type: 'create',
      resource_type: resourceType,
      resource_id: resourceId,
      description: description || `Created new ${resourceType}`,
      metadata
    });
  },

  /**
   * Log when user updates a resource
   */
  logUpdate: (resourceType: string, resourceId: string, description?: string, metadata?: Record<string, unknown>) => {
    return logClientActivity({
      action_type: 'update',
      resource_type: resourceType,
      resource_id: resourceId,
      description: description || `Updated ${resourceType} ${resourceId}`,
      metadata
    });
  },

  /**
   * Log when user deletes a resource
   */
  logDelete: (resourceType: string, resourceId: string, description?: string, metadata?: Record<string, unknown>) => {
    return logClientActivity({
      action_type: 'delete',
      resource_type: resourceType,
      resource_id: resourceId,
      description: description || `Deleted ${resourceType} ${resourceId}`,
      metadata
    });
  },

  /**
   * Log when user exports data
   */
  logExport: (resourceType: string, description?: string, metadata?: Record<string, unknown>) => {
    return logClientActivity({
      action_type: 'export',
      resource_type: resourceType,
      description: description || `Exported ${resourceType} data`,
      metadata
    });
  }
};

// Example usage in components:
/*
import { ActivityLogger } from '../lib/clientActivityLogger';

// In a component where user creates a member
const handleCreateMember = async (memberData) => {
  try {
    const result = await createMember(memberData);
    
    // Log the activity
    await ActivityLogger.logCreate('member', result.id, 'Created new member', {
      member_name: memberData.full_name,
      household_id: memberData.household_id
    });
    
  } catch (error) {
    console.error('Error creating member:', error);
  }
};

// In a component where user views member details
useEffect(() => {
  if (memberId) {
    ActivityLogger.logView('member', memberId, `Viewed member details`);
  }
}, [memberId]);
*/