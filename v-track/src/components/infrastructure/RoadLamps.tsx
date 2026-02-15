"use client";

import { useState, useEffect } from 'react';
import { Lightbulb, Plus, Edit, Trash2, Search, MapPin, ToggleLeft, ToggleRight, Printer } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

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
  is_deleted?: boolean;
}

interface SubRoad {
  id: string;
  name: string;
  road_id: string;
  is_deleted?: boolean;
}

interface Address {
  id: string;
  address: string;
  road_id: string;
  sub_road_id: string;
  is_deleted?: boolean;
}

export default function RoadLamps() {
  const { showSuccess, showError } = useToast();
  const [lamps, setLamps] = useState<RoadLamp[]>([]);
  const [filteredLamps, setFilteredLamps] = useState<RoadLamp[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [subRoads, setSubRoads] = useState<SubRoad[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubRoads, setIsLoadingSubRoads] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLamp, setEditingLamp] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'working' | 'broken'>('all');
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(lamp => lamp.status === statusFilter);
    }

    if (roadFilter) {
      filtered = filtered.filter(lamp => lamp.road_id === roadFilter);
    }

    setFilteredLamps(filtered);
  };

  const handleRoadChange = async (roadId: string) => {
    console.log('Road changed to:', roadId);
    setLampData(prev => ({ ...prev, road_id: roadId, sub_road_id: '', address_id: '' }));
    
    if (roadId) {
      try {
        // Clear previous data and show loading
        setSubRoads([]);
        setAddresses([]);
        setIsLoadingSubRoads(true);
        setIsLoadingAddresses(false);
        
        // Fetch sub-roads for selected road
        const response = await fetch(`/api/roads/${roadId}/sub-roads`);
        console.log('Sub-roads API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Sub-roads data received:', data);
          
          // Filter out deleted sub-roads on client side as additional safety
          const activeSubRoads = data.filter((sr: SubRoad) => !sr.is_deleted);
          setSubRoads(activeSubRoads);
          console.log('Active sub-roads set:', activeSubRoads);
          
          // If no sub-roads exist, fetch addresses directly from main road
          if (activeSubRoads.length === 0) {
            setIsLoadingAddresses(true);
            try {
              const addressResponse = await fetch(`/api/roads/${roadId}/addresses`);
              if (addressResponse.ok) {
                const addressData = await addressResponse.json();
                const activeAddresses = addressData.filter((addr: Address) => !addr.is_deleted);
                setAddresses(activeAddresses);
                console.log('Main road addresses loaded:', activeAddresses);
              }
            } catch (addressError) {
              console.error('Error fetching main road addresses:', addressError);
              setAddresses([]);
            } finally {
              setIsLoadingAddresses(false);
            }
          }
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch sub-roads:', response.status, errorText);
          setSubRoads([]);
        }
      } catch (error) {
        console.error('Error fetching sub-roads:', error);
        setSubRoads([]);
      } finally {
        setIsLoadingSubRoads(false);
      }
    } else {
      console.log('No road selected, clearing sub-roads and addresses');
      setSubRoads([]);
      setAddresses([]);
      setIsLoadingSubRoads(false);
      setIsLoadingAddresses(false);
    }
  };

  const handleSubRoadChange = async (subRoadId: string) => {
    // Update the form data immediately and get the current road_id
    const currentRoadId = lampData.road_id;
    setLampData(prev => ({ ...prev, sub_road_id: subRoadId, address_id: '' }));
    
    console.log('Sub-road changed to:', subRoadId, 'for road:', currentRoadId);
    
    if (subRoadId && currentRoadId) {
      try {
        // Clear previous addresses and show loading
        setAddresses([]);
        setIsLoadingAddresses(true);
        
        console.log('Fetching addresses for road:', currentRoadId, 'sub-road:', subRoadId);
        
        // Fetch addresses for selected sub-road
        const response = await fetch(`/api/roads/${currentRoadId}/sub-roads/${subRoadId}/addresses`);
        console.log('Addresses API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Addresses data received:', data);
          
          // Filter out deleted addresses on client side as additional safety
          const activeAddresses = data.filter((addr: Address) => !addr.is_deleted);
          setAddresses(activeAddresses);
          console.log('Active addresses set:', activeAddresses);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch addresses:', response.status, errorText);
          setAddresses([]);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        setAddresses([]);
      } finally {
        setIsLoadingAddresses(false);
      }
    } else {
      console.log('Clearing addresses - no sub-road or road selected');
      setAddresses([]);
      setIsLoadingAddresses(false);
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
        showSuccess(
          editingLamp ? 'Road Lamp Updated' : 'Road Lamp Added',
          `Road lamp has been ${editingLamp ? 'updated' : 'added'} successfully.`
        );
        resetForm();
        fetchLamps();
      } else {
        const error = await response.json();
        showError(
          'Save Failed',
          error.error || 'Failed to save road lamp'
        );
      }
    } catch (error) {
      console.error('Error submitting road lamp:', error);
      showError(
        'Network Error',
        'An error occurred while saving the road lamp. Please try again.'
      );
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
    setIsLoadingSubRoads(false);
    setIsLoadingAddresses(false);
  };

  const handleEdit = async (lamp: RoadLamp) => {
    setEditingLamp(lamp.id);
    setShowAddForm(true);
    
    // Set the lamp data first
    setLampData({
      lamp_number: lamp.lamp_number,
      road_id: lamp.road_id,
      sub_road_id: lamp.sub_road_id,
      address_id: lamp.address_id,
      status: lamp.status
    });
    
    // Clear any previous data
    setSubRoads([]);
    setAddresses([]);
    
    // Load related data sequentially to ensure proper state
    if (lamp.road_id) {
      try {
        setIsLoadingSubRoads(true);
        
        // First load sub-roads for the selected road
        const subRoadsResponse = await fetch(`/api/roads/${lamp.road_id}/sub-roads`);
        if (subRoadsResponse.ok) {
          const subRoadsData = await subRoadsResponse.json();
          setSubRoads(subRoadsData);
          console.log('Loaded sub-roads for editing:', subRoadsData);
          
          // Then load addresses if sub-road is selected
          if (lamp.sub_road_id) {
            setIsLoadingAddresses(true);
            const addressesResponse = await fetch(`/api/roads/${lamp.road_id}/sub-roads/${lamp.sub_road_id}/addresses`);
            if (addressesResponse.ok) {
              const addressesData = await addressesResponse.json();
              setAddresses(addressesData);
              console.log('Loaded addresses for editing:', addressesData);
            } else {
              console.error('Failed to load addresses for editing');
            }
            setIsLoadingAddresses(false);
          }
        } else {
          console.error('Failed to load sub-roads for editing');
        }
        setIsLoadingSubRoads(false);
      } catch (error) {
        console.error('Error loading related data for editing:', error);
        setIsLoadingSubRoads(false);
        setIsLoadingAddresses(false);
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

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Road Lamp Details Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          h1 {
            text-align: center;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .report-date {
            text-align: center;
            color: #6b7280;
            margin-bottom: 20px;
          }
          .stats {
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f3f4f6;
            border-radius: 8px;
          }
          .stat-card {
            text-align: center;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .stat-label {
            color: #6b7280;
            font-size: 14px;
          }
          .total { color: #2563eb; }
          .working { color: #16a34a; }
          .broken { color: #dc2626; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #374151;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          }
          .status-working {
            background-color: #d1fae5;
            color: #065f46;
          }
          .status-broken {
            background-color: #fee2e2;
            color: #991b1b;
          }
          @media print {
            body { margin: 0; }
            .stats { break-inside: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>Road Lamp Details Report</h1>
        <div class="report-date">Generated on ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</div>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value total">${stats.total}</div>
            <div class="stat-label">Total Lamps</div>
          </div>
          <div class="stat-card">
            <div class="stat-value working">${stats.working}</div>
            <div class="stat-label">Working</div>
          </div>
          <div class="stat-card">
            <div class="stat-value broken">${stats.broken}</div>
            <div class="stat-label">Broken</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Lamp Number</th>
              <th>Status</th>
              <th>Road</th>
              <th>Sub Road</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLamps.map(lamp => `
              <tr>
                <td>${lamp.lamp_number}</td>
                <td>
                  <span class="status-badge status-${lamp.status}">
                    ${lamp.status === 'working' ? 'Working' : 'Broken'}
                  </span>
                </td>
                <td>${lamp.road_name || '-'}</td>
                <td>${lamp.sub_road_name || '-'}</td>
                <td>${lamp.address || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
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
        <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-row gap-4 flex-wrap">
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
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'working' | 'broken')}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
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
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print PDF
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Road Lamp
            </button>
          </div>
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
                {roads.filter(road => !road.is_deleted).map(road => {
                  console.log('Rendering road option:', road);
                  return (
                    <option key={road.id} value={road.id}>{road.name}</option>
                  );
                })}
              </select>
              {roads.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {roads.filter(road => !road.is_deleted).length} road(s) available
                </div>
              )}
            </div>

            {/* Sub Road */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub Road <span className="text-gray-400 text-xs">(Optional)</span></label>
              <select
                value={lampData.sub_road_id}
                onChange={(e) => handleSubRoadChange(e.target.value)}
                disabled={!lampData.road_id || isLoadingSubRoads}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  {isLoadingSubRoads 
                    ? 'Loading sub-roads...' 
                    : subRoads.length === 0 
                      ? 'No Sub Roads Available' 
                      : 'Select Sub Road'
                  }
                </option>
                {subRoads.map(subRoad => {
                  console.log('Rendering sub-road option:', subRoad);
                  return (
                    <option key={subRoad.id} value={subRoad.id}>{subRoad.name}</option>
                  );
                })}
              </select>
              {subRoads.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {subRoads.length} sub-road(s) available for this road
                </div>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <select
                required
                value={lampData.address_id}
                onChange={(e) => setLampData({...lampData, address_id: e.target.value})}
                disabled={isLoadingAddresses}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  {isLoadingAddresses 
                    ? 'Loading addresses...' 
                    : addresses.length === 0 
                      ? 'No Addresses Available' 
                      : 'Select Address'
                  }
                </option>
                {addresses.map(address => {
                  console.log('Rendering address option:', address);
                  return (
                    <option key={address.id} value={address.id}>{address.address}</option>
                  );
                })}
              </select>
              {addresses.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {addresses.length} address(es) available for this sub-road
                </div>
              )}
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

      {/* Road Lamps Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lamp Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLamps.map(lamp => (
                <tr key={lamp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Lightbulb className={`w-5 h-5 mr-3 ${
                        lamp.status === 'working' ? 'text-green-600' : 'text-red-600'
                      }`} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{lamp.lamp_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        lamp.status === 'working' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {lamp.status.toUpperCase()}
                      </span>
                      <button
                        onClick={() => toggleStatus(lamp.id, lamp.status)}
                        className={`ml-2 p-1 rounded transition-colors ${
                          lamp.status === 'working'
                            ? 'bg-green-100 hover:bg-green-200 text-green-700'
                            : 'bg-red-100 hover:bg-red-200 text-red-700'
                        }`}
                        title={`Mark as ${lamp.status === 'working' ? 'broken' : 'working'}`}
                      >
                        {lamp.status === 'working' ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {lamp.road_name}
                      </div>
                      {lamp.sub_road_name && (
                        <div className="text-xs text-gray-500 ml-5">
                          → {lamp.sub_road_name}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{lamp.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(lamp)}
                        className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(lamp.id)}
                        className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredLamps.length === 0 && (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">No road lamps found</p>
            <p className="text-gray-400">Add the first road lamp to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}