'use client';

import React, { useState, useEffect } from 'react';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';

interface RoadDevelopmentData {
  id: string;
  roadName: string;
  subRoadName?: string;
  subSubRoadName: string;
  width: number;
  height: number;
  squareFeet: number; // width * height
  costPerSqFt: number;
  totalCost: number; // squareFeet * costPerSqFt
  developmentStatus: 'developed' | 'undeveloped' | 'in_progress';
  roadType: 'main' | 'sub';
  createdAt: string;
}

interface RoadDevelopmentStats {
  totalProjects: number;
  developedProjects: number;
  undevelopedProjects: number;
  inProgressProjects: number;
  totalEstimatedCost: number;
}

interface Road {
  id: string;
  name: string;
}

interface SubRoad {
  id: string;
  name: string;
  road_id: string;
}

interface FormData {
  roadId: string;
  subRoadId: string;
  subSubRoadName: string; 
  width: number;
  height: number;
  costPerSqFt: number;
  developmentStatus: 'developed' | 'undeveloped' | 'in_progress';
}

export function RoadDevelopment() {
  const [mounted, setMounted] = useState(false);
  const [developmentData, setDevelopmentData] = useState<RoadDevelopmentData[]>([]);
  const [filteredData, setFilteredData] = useState<RoadDevelopmentData[]>([]);
  const [stats, setStats] = useState<RoadDevelopmentStats | null>(null);
  const [roads, setRoads] = useState<Road[]>([]);
  const [subRoads, setSubRoads] = useState<SubRoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirmDialog();
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roadFilter, setRoadFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  // Form data
  const [formData, setFormData] = useState<FormData>({
    roadId: '',
    subRoadId: '',
    subSubRoadName: '',
    width: 25,
    height: 10,
    costPerSqFt: 400,
    developmentStatus: 'undeveloped'
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchDevelopmentData();
      fetchStats();
      fetchRoads();
      fetchSubRoads();
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted) {
      applyFilters();
    }
  }, [developmentData, statusFilter, roadFilter, searchTerm, mounted]);

  const normalizeData = (data: any[]): RoadDevelopmentData[] => {
    return data.map(item => ({
      id: item.id || '',
      roadName: item.roadName || '',
      subRoadName: item.subRoadName,
      subSubRoadName: item.subSubRoadName || '',
      width: item.width || 0,
      height: item.height || 0,
      squareFeet: item.squareFeet || (item.width || 0) * (item.height || 0),
      costPerSqFt: item.costPerSqFt || 0,
      totalCost: item.totalCost || ((item.squareFeet || (item.width || 0) * (item.height || 0)) * (item.costPerSqFt || 0)),
      developmentStatus: item.developmentStatus || 'undeveloped',
      roadType: item.roadType || 'main',
      createdAt: item.createdAt || new Date().toISOString().split('T')[0]
    }));
  };

  const fetchDevelopmentData = async () => {
    try {
      const response = await fetch('/api/road-development');
      if (!response.ok) {
        throw new Error('Failed to fetch road development data');
      }
      const data = await response.json();
      const normalizedData = normalizeData(data);
      setDevelopmentData(normalizedData);
    } catch (error) {
      console.error('Error fetching development data:', error);
      setError('Failed to load development data');
      setDevelopmentData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/road-development?stats=true');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Calculate stats from current data if API fails
        calculateStatsFromData();
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Calculate stats from current data
      calculateStatsFromData();
    }
  };

  const calculateStatsFromData = () => {
    setStats({
      totalProjects: developmentData.length,
      developedProjects: developmentData.filter(d => d.developmentStatus === 'developed').length,
      undevelopedProjects: developmentData.filter(d => d.developmentStatus === 'undeveloped').length,
      inProgressProjects: developmentData.filter(d => d.developmentStatus === 'in_progress').length,
      totalEstimatedCost: developmentData.reduce((sum, d) => sum + (d.totalCost || 0), 0)
    });
  };

  const fetchRoads = async () => {
    try {
      const response = await fetch('/api/roads');
      if (response.ok) {
        const data = await response.json();
        setRoads(data);
      } else {
        console.error('Failed to fetch roads from API');
        setRoads([]);
      }
    } catch (error) {
      console.error('Error fetching roads:', error);
      setRoads([]);
    }
  };

  const fetchSubRoads = async () => {
    try {
      const response = await fetch('/api/sub-roads');
      if (response.ok) {
        const data = await response.json();
        setSubRoads(data);
      } else {
        console.error('Failed to fetch sub roads from API');
        setSubRoads([]);
      }
    } catch (error) {
      console.error('Error fetching sub roads:', error);
      setSubRoads([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...developmentData];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.developmentStatus === statusFilter);
    }

    // Road filter
    if (roadFilter !== 'all') {
      filtered = filtered.filter(item => item.roadName === roadFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.roadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subRoadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subSubRoadName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const calculatedSquareFeet = formData.width * formData.height;
      const calculatedTotalCost = calculatedSquareFeet * formData.costPerSqFt;
      
      // Get road and sub road names
      const selectedRoad = roads.find(r => r.id === formData.roadId);
      const selectedSubRoad = subRoads.find(sr => sr.id === formData.subRoadId);
      
      if (!selectedRoad) {
        showError('Please select a road');
        return;
      }
      
      // Map our form data to the API's expected format
      const submitData = {
        road_id: formData.roadId,
        parent_sub_road_id: formData.subRoadId || null,
        name: formData.subSubRoadName,
        development_parts: 1, // Treating each entry as a single development project
        cost_per_sq_ft: formData.costPerSqFt,
        width: formData.width,
        height: formData.height,
        estimated_area: calculatedSquareFeet,
        total_cost: calculatedTotalCost,
        development_status: formData.developmentStatus
      };
      
      const url = '/api/road-development';
      const method = editId ? 'PUT' : 'POST';
      const body = editId ? { ...submitData, id: editId } : submitData;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        throw new Error(editId ? 'Failed to update road development' : 'Failed to add road development');
      }

      await fetchDevelopmentData();
      await fetchStats();
      
      showSuccess(
        editId ? 'Road development updated successfully' : 'Road development added successfully'
      );
      
      resetForm();
    } catch (error) {
      console.error('Error submitting form:', error);
      showError(
        error instanceof Error ? error.message : (editId ? 'Failed to update road development' : 'Failed to add road development')
      );
    }
  };

  const handleEdit = (item: RoadDevelopmentData) => {
    const road = roads.find(r => r.name === item.roadName);
    const subRoad = subRoads.find(sr => sr.name === item.subRoadName);
    
    setFormData({
      roadId: road?.id || '',
      subRoadId: subRoad?.id || '',
      subSubRoadName: item.subSubRoadName,
      width: item.width,
      height: item.height,
      costPerSqFt: item.costPerSqFt,
      developmentStatus: item.developmentStatus
    });
    setEditId(item.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/road-development`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete road development entry');
      }

      await fetchDevelopmentData();
      await fetchStats();
      showSuccess('Road development entry deleted successfully');
    } catch (error) {
      showError('Failed to delete road development entry');
      console.error('Error deleting entry:', error);
    }
  };

  const handleDeleteClick = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Road Development Entry',
      message: 'Are you sure you want to delete this road development entry? This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      await handleDelete(id);
    }
  };

  const resetForm = () => {
    setFormData({
      roadId: '',
      subRoadId: '',
      subSubRoadName: '',
      width: 25,
      height: 10,
      costPerSqFt: 400,
      developmentStatus: 'undeveloped'
    });
    setEditId(null);
    setShowAddForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'developed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'undeveloped':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    if (!mounted) {
      return `Rs. ${amount.toLocaleString()}`;
    }
    try {
      return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      return `Rs. ${amount.toLocaleString()}`;
    }
  };

  const getSquareFeet = () => {
    return formData.width * formData.height;
  };

  const getTotalCost = () => {
    return getSquareFeet() * formData.costPerSqFt;
  };

  const uniqueRoadNames = Array.from(new Set(developmentData.map(item => item.roadName)));
  const availableSubRoads = subRoads.filter(sr => sr.road_id === formData.roadId);

  if (!mounted || loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Road Development Status</h1>
            <p className="text-gray-600">Track and manage road development projects across the area</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Add Development Project
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Total Projects</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalProjects}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Developed</div>
            <div className="text-3xl font-bold text-green-600">{stats.developedProjects}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500">In Progress</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.inProgressProjects}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Undeveloped</div>
            <div className="text-3xl font-bold text-red-600">{stats.undevelopedProjects}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Total Cost</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalEstimatedCost)}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by road name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="developed">Developed</option>
              <option value="in_progress">In Progress</option>
              <option value="undeveloped">Undeveloped</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Road</label>
            <select
              value={roadFilter}
              onChange={(e) => setRoadFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roads</option>
              {uniqueRoadNames.map((roadName) => (
                <option key={roadName} value={roadName}>{roadName}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('all');
                setRoadFilter('all');
                setSearchTerm('');
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editId ? 'Edit Development Project' : 'Add New Development Project'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Road *</label>
              <select
                value={formData.roadId}
                onChange={(e) => setFormData({ ...formData, roadId: e.target.value, subRoadId: '' })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Road</option>
                {roads.map((road) => (
                  <option key={road.id} value={road.id}>{road.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub Road (Optional)</label>
              <select
                value={formData.subRoadId}
                onChange={(e) => setFormData({ ...formData, subRoadId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No Sub Road</option>
                {availableSubRoads.map((subRoad) => (
                  <option key={subRoad.id} value={subRoad.id}>{subRoad.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub Sub Road Name *</label>
              <input
                type="text"
                value={formData.subSubRoadName}
                onChange={(e) => setFormData({ ...formData, subSubRoadName: e.target.value })}
                required
                placeholder="e.g., 2nd Lane"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Width (ft) *</label>
              <input
                type="number"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
                required
                min="1"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 25"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Length (ft) *</label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
                required
                min="1"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost per Sq Ft (Rs.) *</label>
              <input
                type="number"
                value={formData.costPerSqFt}
                onChange={(e) => setFormData({ ...formData, costPerSqFt: parseFloat(e.target.value) || 0 })}
                required
                min="1"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Development Status *</label>
              <select
                value={formData.developmentStatus}
                onChange={(e) => setFormData({ ...formData, developmentStatus: e.target.value as any })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="undeveloped">Undeveloped</option>
                <option value="in_progress">In Progress</option>
                <option value="developed">Developed</option>
              </select>
            </div>
            
            <div className="md:col-span-2 lg:col-span-3 flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
              >
                {editId ? 'Update Project' : 'Add Project'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
          
          {formData.width > 0 && formData.height > 0 && formData.costPerSqFt > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <div className="text-sm text-blue-800">
                <strong>Calculation:</strong> {formData.width} ft × {formData.height} ft = {getSquareFeet()} sq ft<br/>
                <strong>Total Cost:</strong> {getSquareFeet()} sq ft × Rs. {formData.costPerSqFt} = Rs. {getTotalCost().toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Development Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Development Projects</h2>
          <p className="text-sm text-gray-500">Showing {filteredData.length} of {developmentData.length} projects</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Road Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dimensions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area (sq ft)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost/sq ft
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.roadName}</div>
                    {item.subRoadName && (
                      <div className="text-sm text-gray-500">Sub: {item.subRoadName}</div>
                    )}
                    <div className="text-sm text-gray-500">Lane: {item.subSubRoadName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Width: {item.width || 0} ft</div>
                      <div>Length: {item.height || 0} ft</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(item.squareFeet || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rs. {item.costPerSqFt || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(item.totalCost || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.developmentStatus)}`}>
                      {item.developmentStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredData.length === 0 && (developmentData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg font-medium mb-2">No development projects found</div>
            <div className="text-sm">Click "Add Development Project" to create your first project</div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || statusFilter !== 'all' || roadFilter !== 'all' 
              ? 'No road development data matches your filters' 
              : 'No road development data available'
            }
          </div>
        ))}
      </div>
    </div>
  );
}