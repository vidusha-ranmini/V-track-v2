// Mock data for testing without Supabase connection
export const mockRoads = [
  { id: '1', name: 'Main Road', created_at: '2025-01-01', is_deleted: false },
  { id: '2', name: 'Temple Road', created_at: '2025-01-01', is_deleted: false },
  { id: '3', name: 'School Lane', created_at: '2025-01-01', is_deleted: false },
  { id: '4', name: 'Market Street', created_at: '2025-01-01', is_deleted: false },
];

export const mockSubRoads = [
  { id: '1', name: 'Sub Road A', road_id: '1', created_at: '2025-01-01', is_deleted: false },
  { id: '2', name: 'Sub Road B', road_id: '1', created_at: '2025-01-01', is_deleted: false },
  { id: '3', name: 'Temple Path', road_id: '2', created_at: '2025-01-01', is_deleted: false },
  { id: '4', name: 'School Path', road_id: '3', created_at: '2025-01-01', is_deleted: false },
];

export const mockAddresses = [
  { id: '1', address: '123 Sample Address', road_id: '1', sub_road_id: '1', created_at: '2025-01-01', is_deleted: false },
  { id: '2', address: '124 Sample Address', road_id: '1', sub_road_id: '1', created_at: '2025-01-01', is_deleted: false },
  { id: '3', address: '125 Sample Address', road_id: '1', sub_road_id: '2', created_at: '2025-01-01', is_deleted: false },
  { id: '4', address: '456 Temple Address', road_id: '2', sub_road_id: '3', created_at: '2025-01-01', is_deleted: false },
];

export const mockDashboardStats = {
  totalMembers: 25,
  totalHouseholds: 8,
  totalBusinesses: 5,
  totalRoadLamps: 12,
  workingLamps: 10,
  brokenLamps: 2,
};