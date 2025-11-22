"use client";

import { useState, useEffect } from 'react';
import { Lightbulb, Plus, Edit, Trash2, Search, Filter, MapPin, ToggleLeft, ToggleRight } from 'lucide-react';

interface RoadLamp {
  id: string;
  lamp_number: string;
  road_id: string;
  sub_road_id: string;
  address_id: string;
  status: 'working' | 'broken';
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  // Location data from joins
  road_name?: string;
  sub_road_name?: string;
  address?: string;
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

interface Address {
  id: string;
  address: string;
  road_id: string;
  sub_road_id: string;
}

export default function RoadLamps() {
  const [lamps, setLamps] = useState<RoadLamp[]>([]);
  const [filteredLamps, setFilteredLamps] = useState<RoadLamp[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [subRoads, setSubRoads] = useState<SubRoad[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLamp, setEditingLamp] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roadFilter, setRoadFilter] = useState('');
  
  const [lampData, setLampData] = useState({
    lamp_number: '',
    road_id: '',
    sub_road_id: '',
    address_id: '',
    status: 'working' as 'working' | 'broken'
  });

  useEffect(() => {
    fetchLamps();
    fetchRoads();
  }, []);

  useEffect(() => {
    filterLamps();
  }, [lamps, searchTerm, statusFilter, roadFilter]);

  const fetchLamps = async () => {
    try {
      const response = await fetch('/api/road-lamps');
      if (response.ok) {
        const data = await response.json();
        setLamps(data);
      }
    } catch (error) {
      console.error('Error fetching road lamps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoads = async () => {
    try {
      const response = await fetch('/api/roads');
      if (response.ok) {
        const data = await response.json();
        setRoads(data);
      }
    } catch (error) {
      console.error('Error fetching roads:', error);
    }
  };

  const fetchSubRoads = async (roadId: string) => {
    try {
      const response = await fetch(`/api/roads/${roadId}/sub-roads`);
      if (response.ok) {
        const data = await response.json();
        setSubRoads(data);
        setAddresses([]);
        setLampData(prev => ({ ...prev, sub_road_id: '', address_id: '' }));
      }
    } catch (error) {
      console.error('Error fetching sub-roads:', error);
    }
  };

  const fetchAddresses = async (roadId: string, subRoadId: string) => {
    try {
      const response = await fetch(`/api/roads/${roadId}/sub-roads/${subRoadId}/addresses`);
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
        setLampData(prev => ({ ...prev, address_id: '' }));
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const filterLamps = () => {
    let filtered = lamps.filter(lamp => !lamp.is_deleted);

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(lamp =>
        lamp.lamp_number.toLowerCase().includes(search) ||
        lamp.road_name?.toLowerCase().includes(search) ||
        lamp.sub_road_name?.toLowerCase().includes(search) ||
        lamp.address?.toLowerCase().includes(search)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(lamp => lamp.status === statusFilter);
    }

    if (roadFilter) {
      filtered = filtered.filter(lamp => lamp.road_id === roadFilter);
    }

    setFilteredLamps(filtered);
  };

  const handleRoadChange = (roadId: string) => {
    setLampData(prev => ({ ...prev, road_id: roadId, sub_road_id: '', address_id: '' }));
    if (roadId) {
      fetchSubRoads(roadId);
    } else {
      setSubRoads([]);
      setAddresses([]);
    }
  };

  const handleSubRoadChange = (subRoadId: string) => {
    setLampData(prev => ({ ...prev, sub_road_id: subRoadId, address_id: '' }));
    if (subRoadId && lampData.road_id) {
      fetchAddresses(lampData.road_id, subRoadId);
    } else {
      setAddresses([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const method = editingLamp ? 'PUT' : 'POST';
      const url = editingLamp ? `/api/road-lamps/${editingLamp}` : '/api/road-lamps';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lampData),
      });

      if (response.ok) {
        alert(editingLamp ? 'Road lamp updated successfully!' : 'Road lamp added successfully!');
        resetForm();
        fetchLamps();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.error || 'Failed to save road lamp'));
      }
    } catch (error) {
      console.error('Error submitting road lamp:', error);
      alert('Error saving road lamp');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (lampId: string, currentStatus: 'working' | 'broken') => {
    const newStatus = currentStatus === 'working' ? 'broken' : 'working';
    
    try {
      const response = await fetch(`/api/road-lamps/${lampId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchLamps();
      }
    } catch (error) {
      console.error('Error updating lamp status:', error);
    }
  };

  const resetForm = () => {
    setLampData({
      lamp_number: '',
      road_id: '',
      sub_road_id: '',
      address_id: '',
      status: 'working'
    });
    setEditingLamp(null);
    setShowAddForm(false);
    setSubRoads([]);
    setAddresses([]);
  };

  const handleEdit = (lamp: RoadLamp) => {
    setLampData({
      lamp_number: lamp.lamp_number,
      road_id: lamp.road_id,
      sub_road_id: lamp.sub_road_id,
      address_id: lamp.address_id,
      status: lamp.status
    });
    setEditingLamp(lamp.id);
    setShowAddForm(true);
    
    if (lamp.road_id) {
      fetchSubRoads(lamp.road_id);
      if (lamp.sub_road_id) {
        fetchAddresses(lamp.road_id, lamp.sub_road_id);
      }
    }
  };

  const handleDelete = async (lampId: string) => {
    if (confirm('Are you sure you want to delete this road lamp?')) {
      try {
        const response = await fetch(`/api/road-lamps/${lampId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchLamps();
        }
      } catch (error) {
        console.error('Error deleting road lamp:', error);
      }
    }
  };

  const stats = {
    total: filteredLamps.length,
    working: filteredLamps.filter(l => l.status === 'working').length,
    broken: filteredLamps.filter(l => l.status === 'broken').length
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Road Lamp Management</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Road Lamp Management</h1>
        <p className="text-gray-600 mt-2">Monitor and manage street lighting infrastructure</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Lightbulb className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Lamps</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Lightbulb className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Working</p>
              <p className="text-2xl font-bold text-green-600">{stats.working}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <Lightbulb className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Broken</p>
              <p className="text-2xl font-bold text-red-600">{stats.broken}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search lamps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="working">Working</option>
              <option value="broken">Broken</option>
            </select>

            {/* Road Filter */}
            <select
              value={roadFilter}
              onChange={(e) => setRoadFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Roads</option>
              {roads.map(road => (
                <option key={road.id} value={road.id}>{road.name}</option>
              ))}
            </select>
          </div>

          {/* Add Button */}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Road Lamp
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingLamp ? 'Edit Road Lamp' : 'Add New Road Lamp'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Lamp Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lamp Number</label>
              <input
                type="text"
                required
                value={lampData.lamp_number}
                onChange={(e) => setLampData({...lampData, lamp_number: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., L001"
              />
            </div>

            {/* Road */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Road</label>
              <select
                required
                value={lampData.road_id}
                onChange={(e) => handleRoadChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Road</option>
                {roads.map(road => (
                  <option key={road.id} value={road.id}>{road.name}</option>
                ))}
              </select>
            </div>

            {/* Sub Road */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub Road</label>
              <select
                required
                value={lampData.sub_road_id}
                onChange={(e) => handleSubRoadChange(e.target.value)}
                disabled={!lampData.road_id}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Sub Road</option>
                {subRoads.map(subRoad => (
                  <option key={subRoad.id} value={subRoad.id}>{subRoad.name}</option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <select
                required
                value={lampData.address_id}
                onChange={(e) => setLampData({...lampData, address_id: e.target.value})}
                disabled={!lampData.sub_road_id}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Address</option>
                {addresses.map(address => (
                  <option key={address.id} value={address.id}>{address.address}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={lampData.status}
                onChange={(e) => setLampData({...lampData, status: e.target.value as 'working' | 'broken'})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="working">Working</option>
                <option value="broken">Broken</option>
              </select>
            </div>

            {/* Form Actions */}
            <div className="md:col-span-2 lg:col-span-5 flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingLamp ? 'Update' : 'Add'} Lamp
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Road Lamps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredLamps.map(lamp => (
          <div key={lamp.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Lightbulb className={`w-6 h-6 mr-3 ${
                  lamp.status === 'working' ? 'text-green-600' : 'text-red-600'
                }`} />
                <div>
                  <h3 className="font-semibold text-gray-900">{lamp.lamp_number}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    lamp.status === 'working' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {lamp.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => toggleStatus(lamp.id, lamp.status)}
                className={`p-2 rounded-md transition-colors ${
                  lamp.status === 'working'
                    ? 'bg-green-100 hover:bg-green-200 text-green-700'
                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                }`}
                title={`Mark as ${lamp.status === 'working' ? 'broken' : 'working'}`}
              >
                {lamp.status === 'working' ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                <span>{lamp.road_name}</span>
              </div>
              <div className="pl-6">
                <div>→ {lamp.sub_road_name}</div>
                <div className="text-xs text-gray-500">→ {lamp.address}</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(lamp)}
                className="flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(lamp.id)}
                className="flex items-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
        
        {filteredLamps.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">No road lamps found</p>
            <p className="text-gray-400">Add the first road lamp to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}