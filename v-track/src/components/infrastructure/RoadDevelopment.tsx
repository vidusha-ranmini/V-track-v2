'use client';

import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';

interface RoadDevelopmentData {
  id: string;
  roadName: string;
  subRoadName?: string;
  subSubRoadName: string;
  width: number; // maps to development_parts in DB
  height: number; // maps to estimated_area in DB  
  squareFeet: number; // calculated from width * height
  costPerSqFt: number;
  totalCost: number;
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
    width: 0,
    height: 0,
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

  // Recalculate stats whenever development data changes
  useEffect(() => {
    if (mounted && developmentData.length >= 0) {
      console.log('🔄 Development data changed, recalculating stats...');
      calculateStatsFromData();
    }
  }, [developmentData, mounted]);

  const normalizeData = (data: RoadDevelopmentData[]): RoadDevelopmentData[] => {
    console.log('🔄 Starting normalizeData with input:', data);
    
    if (!Array.isArray(data)) {
      console.error('❌ normalizeData received non-array data:', typeof data, data);
      return [];
    }
    
    const normalized = data.map((item, index) => {
      console.log(`🔄 Normalizing item ${index}:`, item);
      
      // Map database fields to component fields
      // Database uses: width, height for development parts
      // Component uses: width, height for UI consistency
      const width = Number(item.width) || 25;
      const height = Number(item.height) || 10;
      const costPerSqFt = Number(item.costPerSqFt) || 400;
      const squareFeet = Number(item.squareFeet) || (width * height);
      const totalCost = Number(item.totalCost) || (squareFeet * costPerSqFt);
      
      const normalizedItem = {
        id: item.id || '',
        roadName: item.roadName || '',
        subRoadName: item.subRoadName,
        subSubRoadName: item.subSubRoadName || '',
        width,
        height,
        squareFeet,
        costPerSqFt,
        totalCost,
        developmentStatus: (item.developmentStatus || 'undeveloped') as 'developed' | 'undeveloped' | 'in_progress',
        roadType: (item.roadType || 'main') as 'main' | 'sub',
        createdAt: item.createdAt || new Date().toISOString().split('T')[0]
      };
      
      console.log(`✅ Normalized item ${index}:`, normalizedItem);
      return normalizedItem;
    });
    
    console.log('✅ normalizeData completed. Results:', normalized);
    return normalized;
  };

  const fetchDevelopmentData = async () => {
    console.log('🚀 Starting fetchDevelopmentData...');
    try {
      console.log('📡 Fetching road development data from /api/road-development');
      const response = await fetch('/api/road-development');
      console.log('📊 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API response not ok:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error('Failed to fetch road development data');
      }
      
      const data = await response.json();
      console.log('✅ Raw data received:', { count: data?.length || 0, data });
      
      const normalizedData = normalizeData(data);
      console.log('🔄 Data normalized:', { count: normalizedData.length, normalizedData });
      
      setDevelopmentData(normalizedData);
      console.log('✅ Development data set successfully');
    } catch (error) {
      console.error('❌ Error in fetchDevelopmentData:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      setError('Failed to load development data');
      setDevelopmentData([]);
    } finally {
      setLoading(false);
      console.log('🏁 fetchDevelopmentData completed');
    }
  };

  const fetchStats = async () => {
    console.log('📈 Starting fetchStats...');
    try {
      console.log('📡 Fetching stats from /api/road-development?stats=true');
      const response = await fetch('/api/road-development?stats=true');
      console.log('📊 Stats response status:', response.status, response.statusText);
      
      if (response.ok) {
        const rawData = await response.json();
        console.log('📊 Raw stats data received:', rawData);
        
        // Map the API response to match our interface
        const statsData = {
          totalProjects: rawData.total_projects || rawData.totalProjects || 0,
          developedProjects: rawData.developed_projects || rawData.developedProjects || 0,
          undevelopedProjects: rawData.undeveloped_projects || rawData.undevelopedProjects || 0,
          inProgressProjects: rawData.in_progress_projects || rawData.inProgressProjects || 0,
          totalEstimatedCost: rawData.total_estimated_cost || rawData.totalEstimatedCost || 0
        };
        
        console.log('✅ Mapped stats data:', statsData);
        setStats(statsData);
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Stats API failed, calculating from local data:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        // Calculate stats from current data if API fails
        setTimeout(() => calculateStatsFromData(), 100);
      }
    } catch (error) {
      console.error('❌ Error in fetchStats:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      console.log('🔄 Falling back to calculateStatsFromData');
      // Calculate stats from current data
      setTimeout(() => calculateStatsFromData(), 100);
    }
  };

  const calculateStatsFromData = () => {
    console.log('📊 Starting calculateStatsFromData...');
    console.log('📋 Development data for stats:', { count: developmentData.length, data: developmentData });
    
    if (!Array.isArray(developmentData)) {
      console.error('❌ Development data is not an array:', developmentData);
      setStats({
        totalProjects: 0,
        developedProjects: 0,
        undevelopedProjects: 0,
        inProgressProjects: 0,
        totalEstimatedCost: 0
      });
      return;
    }
    
    const stats = {
      totalProjects: developmentData.length,
      developedProjects: developmentData.filter(d => d.developmentStatus === 'developed').length,
      undevelopedProjects: developmentData.filter(d => d.developmentStatus === 'undeveloped').length,
      inProgressProjects: developmentData.filter(d => d.developmentStatus === 'in_progress').length,
      totalEstimatedCost: developmentData.reduce((sum, d) => {
        const cost = Number(d.totalCost) || 0;
        return sum + cost;
      }, 0)
    };
    
    console.log('📈 Calculated stats:', stats);
    setStats(stats);
    console.log('✅ calculateStatsFromData completed');
  };

  const fetchRoads = async () => {
    console.log('🛣️ Starting fetchRoads...');
    try {
      console.log('📡 Fetching roads from /api/roads');
      const response = await fetch('/api/roads');
      console.log('📊 Roads response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Roads data received:', { count: data?.length || 0, data });
        setRoads(data);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch roads from API:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        setRoads([]);
      }
    } catch (error) {
      console.error('❌ Error in fetchRoads:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      setRoads([]);
    }
  };

  const fetchSubRoads = async () => {
    console.log('🛤️ Starting fetchSubRoads...');
    try {
      console.log('📡 Fetching sub roads from /api/sub-roads');
      const response = await fetch('/api/sub-roads');
      console.log('📊 Sub roads response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sub roads data received:', { count: data?.length || 0, data });
        setSubRoads(data);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch sub roads from API:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        setSubRoads([]);
      }
    } catch (error) {
      console.error('❌ Error in fetchSubRoads:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
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
    console.log('📝 Starting handleSubmit...');
    console.log('📋 Form data:', formData);
    console.log('✏️ Edit mode:', editId ? `Editing ID: ${editId}` : 'Creating new');
    
    // Validate form data
    if (!formData.width || formData.width <= 0) {
      console.error('❌ Invalid width value:', formData.width);
      showError('Please enter a valid width greater than 0');
      return;
    }
    
    if (!formData.height || formData.height <= 0) {
      console.error('❌ Invalid length value:', formData.height);
      showError('Please enter a valid length greater than 0');
      return;
    }
    
    if (!formData.costPerSqFt || formData.costPerSqFt <= 0) {
      console.error('❌ Invalid cost per sq ft value:', formData.costPerSqFt);
      showError('Please enter a valid cost per square foot greater than 0');
      return;
    }
    
    try {
      const calculatedSquareFeet = formData.width * formData.height;
      const calculatedTotalCost = calculatedSquareFeet * formData.costPerSqFt;
      console.log('🧮 Calculations:', {
        width: formData.width,
        height: formData.height,
        calculatedSquareFeet,
        costPerSqFt: formData.costPerSqFt,
        calculatedTotalCost
      });
      
      // Get road and sub road names
      const selectedRoad = roads.find(r => r.id === formData.roadId);
      const selectedSubRoad = subRoads.find(sr => sr.id === formData.subRoadId);
      console.log('🔍 Selected references:', {
        selectedRoad,
        selectedSubRoad,
        availableRoads: roads,
        availableSubRoads: subRoads
      });
      
      if (!selectedRoad) {
        console.error('❌ No road selected');
        showError('Please select a road');
        return;
      }
      
      // Map our form data to the API's expected format with correct database field names
      const submitData = {
        road_id: formData.roadId,
        parent_sub_road_id: formData.subRoadId || null,
        name: formData.subSubRoadName,
        width: Number(formData.width),
        height: Number(formData.height),
        cost_per_sq_ft: Number(formData.costPerSqFt),
        development_status: formData.developmentStatus
      };
      
      const url = '/api/road-development';
      const method = editId ? 'PUT' : 'POST';
      const body = editId ? { 
        id: editId, 
        width: Number(formData.width),
        height: Number(formData.height),
        cost_per_sq_ft: Number(formData.costPerSqFt),
        development_status: formData.developmentStatus
      } : submitData;
      
      console.log('📤 Preparing API request:', {
        url,
        method,
        body,
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('📊 API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ API Error details:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestBody: body
        });
        throw new Error(editId ? 'Failed to update road development' : 'Failed to add road development');
      }

      console.log('✅ API request successful, refreshing data...');
      await fetchDevelopmentData();
      await fetchStats();
      
      showSuccess(
        editId ? 'Road development updated successfully' : 'Road development added successfully'
      );
      
      resetForm();
      console.log('✅ handleSubmit completed successfully');
    } catch (error) {
      console.error('❌ Error in handleSubmit:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        formData,
        editId,
        error
      });
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
    console.log('🗑️ Starting handleDelete for ID:', id);
    try {
      console.log('📤 Sending delete request to /api/road-development');
      const deleteBody = { id };
      console.log('📋 Delete request body:', deleteBody);
      
      const response = await fetch(`/api/road-development`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteBody),
      });

      console.log('📊 Delete response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Delete API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestId: id
        });
        throw new Error('Failed to delete road development entry');
      }

      console.log('✅ Delete successful, refreshing data...');
      await fetchDevelopmentData();
      await fetchStats();
      showSuccess('Road development entry deleted successfully');
      console.log('✅ handleDelete completed successfully');
    } catch (error) {
      console.error('❌ Error in handleDelete:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        id,
        error
      });
      showError('Failed to delete road development entry');
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
      width: 0,
      height: 0,
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
    } catch {
      return `Rs. ${amount.toLocaleString()}`;
    }
  };

  const getSquareFeet = () => {
    return formData.width * formData.height;
  };

  const getTotalCost = () => {
    return getSquareFeet() * formData.costPerSqFt;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;

    const printStats = {
      totalProjects: filteredData.length,
      developedProjects: filteredData.filter((item) => item.developmentStatus === 'developed').length,
      inProgressProjects: filteredData.filter((item) => item.developmentStatus === 'in_progress').length,
      undevelopedProjects: filteredData.filter((item) => item.developmentStatus === 'undeveloped').length,
      totalEstimatedCost: filteredData.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0)
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Road Development Status Report</title>
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
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 24px;
          }
          .stat-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            background-color: #f9fafb;
            text-align: center;
          }
          .stat-value {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .stat-label {
            color: #6b7280;
            font-size: 12px;
          }
          .total { color: #111827; }
          .developed { color: #16a34a; }
          .progress { color: #ca8a04; }
          .undeveloped { color: #dc2626; }
          .cost { color: #2563eb; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 10px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background-color: #f3f4f6;
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
            font-weight: 600;
            text-transform: capitalize;
          }
          .status-developed {
            background-color: #dcfce7;
            color: #166534;
          }
          .status-in_progress {
            background-color: #fef9c3;
            color: #854d0e;
          }
          .status-undeveloped {
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
        <h1>Road Development Status Report</h1>
        <div class="report-date">Generated on ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-value total">${printStats.totalProjects}</div>
            <div class="stat-label">Total Projects</div>
          </div>
          <div class="stat-card">
            <div class="stat-value developed">${printStats.developedProjects}</div>
            <div class="stat-label">Developed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value progress">${printStats.inProgressProjects}</div>
            <div class="stat-label">In Progress</div>
          </div>
          <div class="stat-card">
            <div class="stat-value undeveloped">${printStats.undevelopedProjects}</div>
            <div class="stat-label">Undeveloped</div>
          </div>
          <div class="stat-card">
            <div class="stat-value cost">Rs. ${printStats.totalEstimatedCost.toLocaleString()}</div>
            <div class="stat-label">Total Cost</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Road Details</th>
              <th>Dimensions</th>
              <th>Area (sq ft)</th>
              <th>Cost/sq ft</th>
              <th>Total Cost</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map((item) => `
              <tr>
                <td>
                  <div><strong>${item.roadName}</strong></div>
                  ${item.subRoadName ? `<div>Sub: ${item.subRoadName}</div>` : ''}
                  <div>Lane: ${item.subSubRoadName}</div>
                </td>
                <td>
                  <div>Width: ${item.width || 0} ft</div>
                  <div>Length: ${item.height || 0} ft</div>
                </td>
                <td>${(item.squareFeet || 0).toLocaleString()}</td>
                <td>Rs. ${item.costPerSqFt || 0}</td>
                <td>Rs. ${(item.totalCost || 0).toLocaleString()}</td>
                <td>
                  <span class="status-badge status-${item.developmentStatus}">
                    ${item.developmentStatus.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
    };
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
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print PDF
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Add Development Project
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Total Projects</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalProjects || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Developed</div>
            <div className="text-3xl font-bold text-green-600">{stats.developedProjects || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500">In Progress</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.inProgressProjects || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Undeveloped</div>
            <div className="text-3xl font-bold text-red-600">{stats.undevelopedProjects || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Total Cost</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalEstimatedCost || 0)}</div>
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
                value={formData.width || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setFormData({ ...formData, width: value });
                }}
                required
                min="1"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter width in feet"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Length (ft) *</label>
              <input
                type="number"
                value={formData.height || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setFormData({ ...formData, height: value });
                }}
                required
                min="1"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter length in feet"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost per Sq Ft (Rs.) *</label>
              <input
                type="number"
                value={formData.costPerSqFt}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                  setFormData({ ...formData, costPerSqFt: value || 400 });
                }}
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
                onChange={(e) => setFormData({ ...formData, developmentStatus: e.target.value as 'developed' | 'undeveloped' | 'in_progress' })}
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
            <div className="text-sm">Click &quot;Add Development Project&quot; to create your first project</div>
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