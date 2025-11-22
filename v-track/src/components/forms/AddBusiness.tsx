"use client";

import { useState, useEffect } from 'react';
import { Building, MapPin, User, Tag, Save, X, Search, Filter, Download, Edit, Trash2, Eye, Phone, Calendar } from 'lucide-react';

interface Business {
  id?: string;
  business_name: string;
  business_owner: string;
  business_type: string;
  business_address?: string;
  business_phone?: string;
  road_id: string;
  sub_road_id: string;
  road_name?: string;
  sub_road_name?: string;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
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



export default function AddBusiness() {
  const [businessData, setBusinessData] = useState<Business>({
    business_name: '',
    business_owner: '',
    business_type: '',
    business_address: '',
    business_phone: '',
    road_id: '',
    sub_road_id: ''
  });
  
  const [roads, setRoads] = useState<Road[]>([]);
  const [subRoads, setSubRoads] = useState<SubRoad[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    businessType: '',
    road: '',
    subRoad: ''
  });

  const businessTypes = [
    'Restaurant', 'Grocery Store', 'Pharmacy', 'Hardware Store', 'Clothing Store',
    'Electronics Shop', 'Bakery', 'Barber Shop', 'Beauty Salon', 'Internet Cafe',
    'Mobile Shop', 'Vehicle Service', 'Welding Workshop', 'Carpentry', 'Tailoring',
    'Photography Studio', 'Printing Press', 'Stationery Shop', 'Tea Shop', 'Other'
  ];

  useEffect(() => {
    fetchRoads();
    fetchBusinesses();
  }, []);

  useEffect(() => {
    filterBusinesses();
  }, [businesses, searchTerm, filters]);

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
        setBusinessData(prev => ({ ...prev, sub_road_id: '' }));
      }
    } catch (error) {
      console.error('Error fetching sub-roads:', error);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/businesses');
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };

  const filterBusinesses = () => {
    let filtered = businesses.filter(business => !business.is_deleted);

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(business =>
        business.business_name.toLowerCase().includes(search) ||
        business.business_owner.toLowerCase().includes(search) ||
        business.business_type.toLowerCase().includes(search) ||
        business.business_address?.toLowerCase().includes(search) ||
        business.road_name?.toLowerCase().includes(search) ||
        business.sub_road_name?.toLowerCase().includes(search)
      );
    }

    // Business type filter
    if (filters.businessType) {
      filtered = filtered.filter(business => business.business_type === filters.businessType);
    }

    // Road filter
    if (filters.road) {
      filtered = filtered.filter(business => business.road_id === filters.road);
    }

    // Sub road filter
    if (filters.subRoad) {
      filtered = filtered.filter(business => business.sub_road_id === filters.subRoad);
    }

    setFilteredBusinesses(filtered);
  };

  const handleRoadChange = (roadId: string) => {
    setBusinessData(prev => ({ ...prev, road_id: roadId, sub_road_id: '' }));
    if (roadId) {
      fetchSubRoads(roadId);
    } else {
      setSubRoads([]);
    }
  };

  const handleSubRoadChange = (subRoadId: string) => {
    setBusinessData(prev => ({ ...prev, sub_road_id: subRoadId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const method = editingBusiness ? 'PUT' : 'POST';
      const url = editingBusiness ? `/api/businesses/${editingBusiness}` : '/api/businesses';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessData),
      });

      if (response.ok) {
        alert(editingBusiness ? 'Business updated successfully!' : 'Business registered successfully!');
        resetForm();
        fetchBusinesses();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.error || 'Failed to save business'));
      }
    } catch (error) {
      console.error('Error submitting business:', error);
      alert('Error saving business');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setBusinessData({
      business_name: '',
      business_owner: '',
      business_type: '',
      business_address: '',
      business_phone: '',
      road_id: '',
      sub_road_id: ''
    });
    setEditingBusiness(null);
    setSubRoads([]);
  };

  const handleEdit = (business: Business) => {
    setBusinessData(business);
    setEditingBusiness(business.id!);
    // Fetch related data
    if (business.road_id) {
      fetchSubRoads(business.road_id);
    }
  };

  const handleDelete = async (businessId: string) => {
    if (confirm('Are you sure you want to delete this business?')) {
      try {
        const response = await fetch(`/api/businesses/${businessId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchBusinesses();
        }
      } catch (error) {
        console.error('Error deleting business:', error);
      }
    }
  };

  const getLocationString = (business: Business) => {
    const road = business.road_name || roads.find(r => r.id === business.road_id)?.name || business.road_id;
    const subRoad = business.sub_road_name || (business.sub_road_id ? (subRoads.find(sr => sr.id === business.sub_road_id)?.name || business.sub_road_id) : 'Main Road');
    const address = business.business_address || 'No specific address';
    return `${road} → ${subRoad} → ${address}`;
  };

  const handleBusinessClick = (business: Business) => {
    setSelectedBusiness(business);
    setShowBusinessModal(true);
  };

  const closeBusinessModal = () => {
    setShowBusinessModal(false);
    setSelectedBusiness(null);
  };

  const exportBusinessData = () => {
    const csv = [
      ['Business Name', 'Owner', 'Type', 'Phone', 'Address', 'Road', 'Sub Road', 'Created Date'],
      ...filteredBusinesses.map(business => [
        business.business_name,
        business.business_owner,
        business.business_type,
        business.business_phone || '',
        business.business_address || '',
        business.road_name || '',
        business.sub_road_name || 'Main Road',
        business.created_at ? new Date(business.created_at).toLocaleDateString() : ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'village_businesses.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getUniqueBusinessTypes = () => {
    const types = [...new Set(businesses.filter(b => !b.is_deleted).map(b => b.business_type))];
    return types.sort();
  };

  const getFilteredSubRoads = () => {
    if (!filters.road) return [];
    return subRoads.filter(sr => sr.road_id === filters.road);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Management</h1>
        <p className="text-gray-600 mt-2">Register new businesses and manage existing business information</p>
      </div>

      {/* Registration Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center mb-6">
          <Building className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">
            {editingBusiness ? 'Edit Business Information' : 'Register New Business'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Business Name */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 mr-2" />
                Business Name *
              </label>
              <input
                type="text"
                required
                value={businessData.business_name}
                onChange={(e) => setBusinessData({...businessData, business_name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter business name"
              />
            </div>

            {/* Business Owner */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 mr-2" />
                Business Owner *
              </label>
              <input
                type="text"
                required
                value={businessData.business_owner}
                onChange={(e) => setBusinessData({...businessData, business_owner: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter owner name"
              />
            </div>

            {/* Business Phone */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 mr-2" />
                Contact Number
              </label>
              <input
                type="tel"
                value={businessData.business_phone || ''}
                onChange={(e) => setBusinessData({...businessData, business_phone: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter contact number"
              />
            </div>

            {/* Business Type */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Business Type *
              </label>
              <select
                required
                value={businessData.business_type}
                onChange={(e) => setBusinessData({...businessData, business_type: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select business type</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Road */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Road *</label>
              <select
                required
                value={businessData.road_id}
                onChange={(e) => handleRoadChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Road</option>
                {roads.map(road => (
                  <option key={road.id} value={road.id}>{road.name}</option>
                ))}
              </select>
            </div>

            {/* Sub Road */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Sub Road</label>
              <select
                value={businessData.sub_road_id}
                onChange={(e) => handleSubRoadChange(e.target.value)}
                disabled={!businessData.road_id}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Main Road (No Sub Road)</option>
                {subRoads.map(subRoad => (
                  <option key={subRoad.id} value={subRoad.id}>{subRoad.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Business Address */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Business Address</label>
            <input
              type="text"
              value={businessData.business_address || ''}
              onChange={(e) => setBusinessData({...businessData, business_address: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter specific business address, building name, or landmark"
            />
            <p className="text-xs text-gray-500 mt-1">Optional: Specific address details to help locate the business</p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : editingBusiness ? 'Update Business' : 'Register Business'}
            </button>
            
            {editingBusiness && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Business Listing with Filters */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              Registered Businesses
            </h2>
            <button
              onClick={exportBusinessData}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Business Type Filter */}
            <div>
              <select
                value={filters.businessType}
                onChange={(e) => setFilters({...filters, businessType: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Business Types</option>
                {getUniqueBusinessTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Road Filter */}
            <div>
              <select
                value={filters.road}
                onChange={(e) => setFilters({...filters, road: e.target.value, subRoad: ''})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Roads</option>
                {roads.map(road => (
                  <option key={road.id} value={road.id}>{road.name}</option>
                ))}
              </select>
            </div>

            {/* Sub Road Filter */}
            <div>
              <select
                value={filters.subRoad}
                onChange={(e) => setFilters({...filters, subRoad: e.target.value})}
                disabled={!filters.road}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">All Sub Roads</option>
                {getFilteredSubRoads().map(subRoad => (
                  <option key={subRoad.id} value={subRoad.id}>{subRoad.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({ businessType: '', road: '', subRoad: '' });
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <p className="text-gray-600">
            Showing {filteredBusinesses.length} of {businesses.filter(b => !b.is_deleted).length} businesses
          </p>
        </div>

        {/* Business Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner & Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBusinesses.map((business) => (
                <tr 
                  key={business.id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleBusinessClick(business)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{business.business_name}</div>
                      {business.business_address && (
                        <div className="text-sm text-gray-500">{business.business_address}</div>
                      )}
                      {business.created_at && (
                        <div className="text-xs text-gray-400">
                          Registered: {new Date(business.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{business.business_owner}</div>
                      {business.business_phone && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {business.business_phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{business.road_name || 'Unknown Road'}</div>
                      <div className="text-gray-500 text-xs">
                        {business.sub_road_name || 'Main Road'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {business.business_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBusinessClick(business);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(business);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit business"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(business.id!);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete business"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredBusinesses.length === 0 && (
            <div className="text-center py-12">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No businesses found matching your criteria.</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or register a new business.</p>
            </div>
          )}
        </div>
      </div>

      {/* Business Details Modal */}
      {showBusinessModal && selectedBusiness && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeBusinessModal();
            }
          }}
        >
          <div 
            className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl my-8 mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Building className="w-6 h-6 mr-2 text-blue-600" />
                Business Details
              </h3>
              <button
                onClick={closeBusinessModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Business Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-blue-600" />
                  Business Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Name</label>
                    <p className="text-sm text-gray-900 font-medium">{selectedBusiness.business_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Type</label>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {selectedBusiness.business_type}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Owner</label>
                    <p className="text-sm text-gray-900">{selectedBusiness.business_owner}</p>
                  </div>
                  {selectedBusiness.business_phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                      <p className="text-sm text-gray-900 flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        {selectedBusiness.business_phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-green-600" />
                  Location Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Road</label>
                    <p className="text-sm text-gray-900 font-medium">{selectedBusiness.road_name || 'Unknown Road'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sub Road</label>
                    <p className="text-sm text-gray-900">{selectedBusiness.sub_road_name || 'Main Road'}</p>
                  </div>
                  {selectedBusiness.business_address && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Specific Address</label>
                      <p className="text-sm text-gray-900">{selectedBusiness.business_address}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Full Location</label>
                    <p className="text-sm text-blue-600">
                      {getLocationString(selectedBusiness)}
                    </p>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                  System Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  {selectedBusiness.created_at && (
                    <div>
                      <label className="block font-medium text-gray-700">Registered</label>
                      <p>{new Date(selectedBusiness.created_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedBusiness.updated_at && (
                    <div>
                      <label className="block font-medium text-gray-700">Last Updated</label>
                      <p>{new Date(selectedBusiness.updated_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <label className="block font-medium text-gray-700">Business ID</label>
                    <p className="font-mono">{selectedBusiness.id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg space-x-4">
              <button
                onClick={() => {
                  closeBusinessModal();
                  handleEdit(selectedBusiness);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Business
              </button>
              <button
                onClick={closeBusinessModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deleted Businesses */}
      {businesses.filter(b => b.is_deleted).length > 0 && (
        <div className="mt-8 bg-red-50 p-6 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
            <Trash2 className="w-5 h-5 mr-2" />
            Deleted Businesses
          </h3>
          <div className="space-y-2">
            {businesses.filter(b => b.is_deleted).map(business => (
              <div key={business.id} className="flex justify-between items-center p-3 bg-red-100 rounded">
                <span className="text-red-800">
                  {business.business_name} - {business.business_owner} ({business.business_type})
                </span>
                <span className="text-xs text-red-600 bg-red-200 px-2 py-1 rounded">DELETED</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}