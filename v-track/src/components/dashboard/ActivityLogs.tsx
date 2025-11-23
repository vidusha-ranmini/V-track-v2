import React, { useState, useEffect, useCallback } from 'react';
import { UserActivityLog } from '../../lib/supabase';

interface ActivityLogsProps {
  showRecentLogsOnly?: boolean;
  maxItems?: number;
}

interface ActivityLogsState {
  logs: UserActivityLog[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalCount: number;
  filters: {
    username?: string;
    action_type?: string;
    resource_type?: string;
    start_date?: string;
    end_date?: string;
  };
}

const ActivityLogs: React.FC<ActivityLogsProps> = ({ 
  showRecentLogsOnly = false, 
  maxItems = 50 
}) => {
  const [state, setState] = useState<ActivityLogsState>({
    logs: [],
    loading: false,
    error: null,
    currentPage: 1,
    totalCount: 0,
    filters: {}
  });

  const fetchActivityLogs = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setState(prev => ({ ...prev, error: 'No authentication token found', loading: false }));
        return;
      }

      const searchParams = new URLSearchParams();
      
      if (showRecentLogsOnly) {
        searchParams.append('recent_logins', 'true');
        searchParams.append('limit', maxItems.toString());
      } else {
        searchParams.append('limit', '50');
        searchParams.append('offset', ((state.currentPage - 1) * 50).toString());
        
        // Add filters
        if (state.filters.username) searchParams.append('username', state.filters.username);
        if (state.filters.action_type) searchParams.append('action_type', state.filters.action_type);
        if (state.filters.resource_type) searchParams.append('resource_type', state.filters.resource_type);
        if (state.filters.start_date) searchParams.append('start_date', state.filters.start_date);
        if (state.filters.end_date) searchParams.append('end_date', state.filters.end_date);
      }

      const response = await fetch(`/api/activity-logs?${searchParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          logs: result.data,
          totalCount: result.count,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || 'Failed to fetch activity logs',
          loading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Error fetching activity logs: ${(error as Error).message}`,
        loading: false
      }));
    }
  }, [state.currentPage, showRecentLogsOnly, maxItems, state.filters]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  const handleFilterChange = (field: keyof ActivityLogsState['filters'], value: string) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [field]: value || undefined
      },
      currentPage: 1
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'login': return 'bg-green-100 text-green-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      case 'create': return 'bg-blue-100 text-blue-800';
      case 'update': return 'bg-yellow-100 text-yellow-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'view': return 'bg-indigo-100 text-indigo-800';
      case 'export': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {},
      currentPage: 1
    }));
  };

  if (showRecentLogsOnly) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Login Activities</h3>
        
        {state.loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {state.error && (
          <div className="text-red-600 text-center py-4">{state.error}</div>
        )}

        {!state.loading && !state.error && (
          <div className="space-y-3">
            {state.logs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent login activities found.</p>
            ) : (
              state.logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{log.username}</p>
                    <p className="text-sm text-gray-600">{log.description}</p>
                    {log.ip_address && (
                      <p className="text-xs text-gray-500">IP: {log.ip_address}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action_type)}`}>
                      {log.action_type}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(log.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={fetchActivityLogs}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Activity Logs</h2>
        <p className="text-sm text-gray-600 mt-1">View and filter user activity logs</p>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={state.filters.username || ''}
              onChange={(e) => handleFilterChange('username', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Filter by username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Action Type</label>
            <select
              value={state.filters.action_type || ''}
              onChange={(e) => handleFilterChange('action_type', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="view">View</option>
              <option value="export">Export</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Resource Type</label>
            <select
              value={state.filters.resource_type || ''}
              onChange={(e) => handleFilterChange('resource_type', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All resources</option>
              <option value="member">Member</option>
              <option value="household">Household</option>
              <option value="business">Business</option>
              <option value="road">Road</option>
              <option value="address">Address</option>
              <option value="road-lamp">Road Lamp</option>
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={fetchActivityLogs}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {state.loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {state.error && (
          <div className="text-red-600 text-center py-8">{state.error}</div>
        )}

        {!state.loading && !state.error && (
          <>
            {state.logs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No activity logs found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {state.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action_type)}`}>
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.resource_type ? (
                            <div>
                              <div className="font-medium">{log.resource_type}</div>
                              {log.resource_id && (
                                <div className="text-gray-500 text-xs">{log.resource_id}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ip_address || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(log.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {state.totalCount > 50 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing {((state.currentPage - 1) * 50) + 1} to {Math.min(state.currentPage * 50, state.totalCount)} of {state.totalCount} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setState(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={state.currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setState(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={state.currentPage * 50 >= state.totalCount}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;