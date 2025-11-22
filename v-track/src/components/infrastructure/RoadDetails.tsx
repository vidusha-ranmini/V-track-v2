"use client";

import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Building2, TreePine, Home } from 'lucide-react';

interface Road {
  id: string;
  name: string;
  created_at: string;
  is_deleted: boolean;
}

interface SubRoad {
  id: string;
  name: string;
  road_id: string;
  created_at: string;
  is_deleted: boolean;
}

interface SubSubRoad {
  id: string;
  name: string;
  road_id: string;
  parent_sub_road_id: string;
  development_status: 'developed' | 'undeveloped';
  created_at: string;
  is_deleted: boolean;
}

interface Address {
  id: string;
  address: string;
  road_id: string;
  sub_road_id: string;
  member?: string;
  created_at: string;
  is_deleted: boolean;
}

type ActiveTab = 'roads' | 'sub-roads' | 'sub-sub-roads' | 'addresses';

export default function RoadDetails() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('roads');
  const [roads, setRoads] = useState<Road[]>([]);
  const [subRoads, setSubRoads] = useState<SubRoad[]>([]);
  const [subSubRoads, setSubSubRoads] = useState<SubSubRoad[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoad, setFilterRoad] = useState('');
  const [filterSubRoad, setFilterSubRoad] = useState('');
  const [expandedRoads, setExpandedRoads] = useState<Set<string>>(new Set());
  const [expandedSubRoads, setExpandedSubRoads] = useState<Set<string>>(new Set());
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [selectedRoad, setSelectedRoad] = useState('');
  const [selectedSubRoad, setSelectedSubRoad] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    development_status: 'undeveloped' as 'developed' | 'undeveloped'
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  // Reset filters when switching tabs
  useEffect(() => {
    setSearchTerm('');
    setFilterRoad('');
    setFilterSubRoad('');
  }, [activeTab]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchRoads(),
        fetchSubRoads(),
        fetchSubSubRoads(),
        fetchAddresses()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const fetchSubRoads = async () => {
    try {
      const response = await fetch('/api/sub-roads');
      if (response.ok) {
        const data = await response.json();
        setSubRoads(data);
      }
    } catch (error) {
      console.error('Error fetching sub-roads:', error);
    }
  };

  const fetchSubSubRoads = async () => {
    try {
      const response = await fetch('/api/sub-sub-roads');
      if (response.ok) {
        const data = await response.json();
        setSubSubRoads(data);
      }
    } catch (error) {
      console.error('Error fetching sub-sub-roads:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/addresses');
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let endpoint = '';
      let payload: any = {};

      switch (activeTab) {
        case 'roads':
          endpoint = editingItem ? `/api/roads/${editingItem}` : '/api/roads';
          payload = { name: formData.name };
          break;
        case 'sub-roads':
          endpoint = editingItem ? `/api/sub-roads/${editingItem}` : '/api/sub-roads';
          payload = { name: formData.name, road_id: selectedRoad };
          break;
        case 'sub-sub-roads':
          endpoint = editingItem ? `/api/sub-sub-roads/${editingItem}` : '/api/sub-sub-roads';
          payload = {
            name: formData.name,
            road_id: selectedRoad,
            parent_sub_road_id: selectedSubRoad,
            development_status: formData.development_status
          };
          break;
        case 'addresses':
          endpoint = editingItem ? `/api/addresses/${editingItem}` : '/api/addresses';
          payload = {
            address: formData.address,
            road_id: selectedRoad,
            sub_road_id: selectedSubRoad
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(`${activeTab} ${editingItem ? 'updated' : 'added'} successfully!`);
        resetForm();
        fetchAllData();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.error || 'Failed to save'));
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Error saving data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, type: ActiveTab) => {
    if (confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
      try {
        let endpoint = '';
        switch (type) {
          case 'roads':
            endpoint = `/api/roads/${id}`;
            break;
          case 'sub-roads':
            endpoint = `/api/sub-roads/${id}`;
            break;
          case 'sub-sub-roads':
            endpoint = `/api/sub-sub-roads/${id}`;
            break;
          case 'addresses':
            endpoint = `/api/addresses/${id}`;
            break;
        }

        const response = await fetch(endpoint, { method: 'DELETE' });
        
        if (response.ok) {
          alert(`${type.slice(0, -1)} deleted successfully!`);
          fetchAllData();
        } else {
          const error = await response.json();
          alert('Error: ' + (error.error || `Failed to delete ${type.slice(0, -1)}`));
        }
      } catch (error) {
        console.error('Error deleting:', error);
        alert(`Failed to delete ${type.slice(0, -1)}. Please try again.`);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', address: '', development_status: 'undeveloped' });
    setEditingItem(null);
    setShowAddForm(false);
    setSelectedRoad('');
    setSelectedSubRoad('');
  };

  const handleEdit = (item: any, type: ActiveTab) => {
    if (type === 'addresses') {
      setFormData({ ...formData, address: item.address, name: '' });
    } else {
      setFormData({ 
        ...formData, 
        name: item.name, 
        development_status: item.development_status || 'undeveloped' 
      });
    }
    setEditingItem(item.id);
    setShowAddForm(true);
    
    if (type !== 'roads') {
      setSelectedRoad(item.road_id);
    }
    if (type === 'sub-sub-roads' || type === 'addresses') {
      setSelectedSubRoad(item.parent_sub_road_id || item.sub_road_id);
    }
  };

  const toggleRoadExpansion = (roadId: string) => {
    const newExpanded = new Set(expandedRoads);
    if (newExpanded.has(roadId)) {
      newExpanded.delete(roadId);
    } else {
      newExpanded.add(roadId);
    }
    setExpandedRoads(newExpanded);
  };

  const toggleSubRoadExpansion = (subRoadId: string) => {
    const newExpanded = new Set(expandedSubRoads);
    if (newExpanded.has(subRoadId)) {
      newExpanded.delete(subRoadId);
    } else {
      newExpanded.add(subRoadId);
    }
    setExpandedSubRoads(newExpanded);
  };

  const getSubRoadsForRoad = (roadId: string) => 
    subRoads.filter(sr => sr.road_id === roadId && !sr.is_deleted);

  const getSubSubRoadsForSubRoad = (subRoadId: string) => 
    subSubRoads.filter(ssr => ssr.parent_sub_road_id === subRoadId && !ssr.is_deleted);

  const getAddressesForSubRoad = (roadId: string, subRoadId: string) => 
    addresses.filter(a => a.road_id === roadId && a.sub_road_id === subRoadId && !a.is_deleted);

  // Filter functions
  const getFilteredRoads = () => {
    return roads.filter(road => 
      !road.is_deleted &&
      road.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredSubRoads = () => {
    return subRoads.filter(subRoad => {
      if (subRoad.is_deleted) return false;
      
      const matchesSearch = subRoad.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRoadFilter = !filterRoad || subRoad.road_id === filterRoad;
      
      return matchesSearch && matchesRoadFilter;
    });
  };

  const getFilteredSubSubRoads = () => {
    return subSubRoads.filter(subSubRoad => {
      if (subSubRoad.is_deleted) return false;
      
      const matchesSearch = subSubRoad.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRoadFilter = !filterRoad || subSubRoad.road_id === filterRoad;
      const matchesSubRoadFilter = !filterSubRoad || subSubRoad.parent_sub_road_id === filterSubRoad;
      
      return matchesSearch && matchesRoadFilter && matchesSubRoadFilter;
    });
  };

  const getFilteredAddresses = () => {
    return addresses.filter(address => {
      if (address.is_deleted) return false;
      
      const matchesSearch = address.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (address.member && address.member.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRoadFilter = !filterRoad || address.road_id === filterRoad;
      const matchesSubRoadFilter = !filterSubRoad || address.sub_road_id === filterSubRoad;
      
      return matchesSearch && matchesRoadFilter && matchesSubRoadFilter;
    });
  };

  const tabs = [
    { id: 'roads' as ActiveTab, label: 'Roads', icon: MapPin, count: roads.filter(r => !r.is_deleted).length },
    { id: 'sub-roads' as ActiveTab, label: 'Sub Roads', icon: Building2, count: subRoads.filter(sr => !sr.is_deleted).length },
    { id: 'sub-sub-roads' as ActiveTab, label: 'Sub Sub Roads', icon: TreePine, count: subSubRoads.filter(ssr => !ssr.is_deleted).length },
    { id: 'addresses' as ActiveTab, label: 'Addresses', icon: Home, count: addresses.filter(a => !a.is_deleted).length }
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Road Infrastructure Management</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Road Infrastructure Management</h1>
        <p className="text-gray-600 mt-2">Manage roads, sub-roads, and address hierarchies</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Filter Controls */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search by name, address, or member..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Road Filter */}
              {(activeTab === 'sub-roads' || activeTab === 'sub-sub-roads' || activeTab === 'addresses') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Road</label>
                  <select
                    value={filterRoad}
                    onChange={(e) => {
                      setFilterRoad(e.target.value);
                      setFilterSubRoad(''); // Reset sub-road filter when road changes
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Roads</option>
                    {roads.filter(r => !r.is_deleted).map(road => (
                      <option key={road.id} value={road.id}>{road.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sub-Road Filter */}
              {(activeTab === 'sub-sub-roads' || activeTab === 'addresses') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Sub-Road</label>
                  <select
                    value={filterSubRoad}
                    onChange={(e) => setFilterSubRoad(e.target.value)}
                    disabled={!filterRoad}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">All Sub-Roads</option>
                    {subRoads.filter(sr => sr.road_id === filterRoad && !sr.is_deleted).map(subRoad => (
                      <option key={subRoad.id} value={subRoad.id}>{subRoad.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || filterRoad || filterSubRoad) && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterRoad('');
                    setFilterSubRoad('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {tabs.find(t => t.id === activeTab)?.label} Management
            </h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-medium mb-4">
                {editingItem ? 'Edit' : 'Add New'} {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Parent Road Selection */}
                  {(activeTab === 'sub-roads' || activeTab === 'sub-sub-roads' || activeTab === 'addresses') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parent Road</label>
                      <select
                        required
                        value={selectedRoad}
                        onChange={(e) => setSelectedRoad(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Road</option>
                        {roads.filter(r => !r.is_deleted).map(road => (
                          <option key={road.id} value={road.id}>{road.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Parent Sub Road Selection */}
                  {(activeTab === 'sub-sub-roads' || activeTab === 'addresses') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parent Sub Road</label>
                      <select
                        required
                        value={selectedSubRoad}
                        onChange={(e) => setSelectedSubRoad(e.target.value)}
                        disabled={!selectedRoad}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Sub Road</option>
                        {subRoads.filter(sr => sr.road_id === selectedRoad && !sr.is_deleted).map(subRoad => (
                          <option key={subRoad.id} value={subRoad.id}>{subRoad.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Name/Address Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {activeTab === 'addresses' ? 'Address' : 'Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={activeTab === 'addresses' ? formData.address : formData.name}
                      onChange={(e) => {
                        if (activeTab === 'addresses') {
                          setFormData({...formData, address: e.target.value});
                        } else {
                          setFormData({...formData, name: e.target.value});
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder={activeTab === 'addresses' ? 'Enter address' : 'Enter name'}
                    />
                  </div>

                  {/* Development Status for Sub Sub Roads */}
                  {activeTab === 'sub-sub-roads' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Development Status</label>
                      <select
                        value={formData.development_status}
                        onChange={(e) => setFormData({...formData, development_status: e.target.value as 'developed' | 'undeveloped'})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="undeveloped">Undeveloped</option>
                        <option value="developed">Developed</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingItem ? 'Update' : 'Add'}
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

          {/* Tab-specific Content */}
          <div className="space-y-4">
            {activeTab === 'roads' && (
              <div className="bg-white rounded-lg overflow-hidden border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Road Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sub-roads Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredRoads().map((road) => (
                        <tr key={road.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <MapPin className="w-5 h-5 text-blue-600 mr-3" />
                              <div className="text-sm font-medium text-gray-900">{road.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSubRoadsForRoad(road.id).length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(road, 'roads')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(road.id, 'roads')}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {getFilteredRoads().length === 0 && (
                    <div className="text-center py-12">
                      <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 text-lg">
                        {searchTerm ? 'No roads match your search' : 'No roads found'}
                      </p>
                      <p className="text-gray-400">
                        {searchTerm ? 'Try adjusting your search terms' : 'Add the first road to get started'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'sub-roads' && (
              <div className="bg-white rounded-lg overflow-hidden border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sub-road Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Parent Road
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sub-sub-roads Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Addresses Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredSubRoads().map((subRoad) => {
                        const parentRoad = roads.find(r => r.id === subRoad.road_id);
                        return (
                          <tr key={subRoad.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Building2 className="w-5 h-5 text-green-600 mr-3" />
                                <div className="text-sm font-medium text-gray-900">{subRoad.name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {parentRoad?.name || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getSubSubRoadsForSubRoad(subRoad.id).length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getAddressesForSubRoad(subRoad.road_id, subRoad.id).length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(subRoad, 'sub-roads')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(subRoad.id, 'sub-roads')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {getFilteredSubRoads().length === 0 && (
                    <div className="text-center py-12">
                      <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 text-lg">
                        {searchTerm || filterRoad ? 'No sub-roads match your filters' : 'No sub-roads found'}
                      </p>
                      <p className="text-gray-400">
                        {searchTerm || filterRoad ? 'Try adjusting your search terms or filters' : 'Add the first sub-road to get started'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'sub-sub-roads' && (
              <div className="bg-white rounded-lg overflow-hidden border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sub-sub-road Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Parent Road
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Parent Sub-road
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Development Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredSubSubRoads().map((subSubRoad) => {
                        const parentRoad = roads.find(r => r.id === subSubRoad.road_id);
                        const parentSubRoad = subRoads.find(sr => sr.id === subSubRoad.parent_sub_road_id);
                        return (
                          <tr key={subSubRoad.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <TreePine className="w-5 h-5 text-purple-600 mr-3" />
                                <div className="text-sm font-medium text-gray-900">{subSubRoad.name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {parentRoad?.name || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {parentSubRoad?.name || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                subSubRoad.development_status === 'developed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {subSubRoad.development_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(subSubRoad, 'sub-sub-roads')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(subSubRoad.id, 'sub-sub-roads')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {getFilteredSubSubRoads().length === 0 && (
                    <div className="text-center py-12">
                      <TreePine className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 text-lg">
                        {searchTerm || filterRoad || filterSubRoad ? 'No sub-sub-roads match your filters' : 'No sub-sub-roads found'}
                      </p>
                      <p className="text-gray-400">
                        {searchTerm || filterRoad || filterSubRoad ? 'Try adjusting your search terms or filters' : 'Add the first sub-sub-road to get started'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white rounded-lg overflow-hidden border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Road
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sub-road
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredAddresses().map((address) => {
                        const parentRoad = roads.find(r => r.id === address.road_id);
                        const parentSubRoad = subRoads.find(sr => sr.id === address.sub_road_id);
                        return (
                          <tr key={address.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Home className="w-5 h-5 text-orange-600 mr-3" />
                                <div className="text-sm font-medium text-gray-900">{address.address}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {parentRoad?.name || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {parentSubRoad?.name || 'Main Road'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {address.member || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(address, 'addresses')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(address.id, 'addresses')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {getFilteredAddresses().length === 0 && (
                    <div className="text-center py-12">
                      <Home className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 text-lg">
                        {searchTerm || filterRoad || filterSubRoad ? 'No addresses match your filters' : 'No addresses found'}
                      </p>
                      <p className="text-gray-400">
                        {searchTerm || filterRoad || filterSubRoad ? 'Try adjusting your search terms or filters' : 'Add the first address to get started'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}