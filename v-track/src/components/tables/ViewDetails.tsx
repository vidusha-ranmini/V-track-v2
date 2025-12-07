"use client";

import { useState, useEffect } from 'react';
import { Search, Download, Edit, Trash2, X, User, Phone, MapPin, Briefcase, Calendar, Home } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Member {
  id: string;
  household_id: string;
  full_name: string;
  name_with_initial: string;
  member_type: string;
  nic: string;
  gender: string;
  age: number;
  occupation: string;
  school_name?: string;
  grade?: number;
  university_name?: string;
  other_occupation?: string;
  offers_receiving?: string[];
  is_disabled: boolean;
  land_house_status?: string;
  whatsapp_number?: string;
  workplace_address?: string;
  workplace_location?: string;
  is_drug_user?: boolean;
  is_thief?: boolean;
  mahapola?: boolean;
  aswasuma?: boolean;
  wadihiti_dimana?: boolean;
  is_deleted: boolean;
  // Address data from household -> addresses relationship
  address?: string;
  road_name?: string;
  sub_road_name?: string;
  road_id?: string;
  sub_road_id?: string;
  // Household data
  resident_type?: string;
  assessment_number?: string;
  waste_disposal?: string;
  household_created_at?: string;
  household_updated_at?: string;
  // System fields
  created_at?: string;
  updated_at?: string;
}

export default function ViewDetails() {
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirmDialog();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditHouseholdModal, setShowEditHouseholdModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingHousehold, setEditingHousehold] = useState<{
    id: string;
    assessment_number: string;
    resident_type: string;
    waste_disposal: string;
  } | null>(null);
  const [filters, setFilters] = useState({
    residentType: '',
    occupation: '',
    beneficiary: '',
    road: '',
    subRoad: '',
  });
  const [roads, setRoads] = useState<{id: string, name: string}[]>([]);
  const [subRoads, setSubRoads] = useState<{id: string, name: string, road_id: string}[]>([]);
  const [filteredSubRoads, setFilteredSubRoads] = useState<{id: string, name: string, road_id: string}[]>([]);
  
  useEffect(() => {
    fetchMembers();
    fetchRoads();
    fetchSubRoads();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [members, searchTerm, filters]);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      if (response.ok) {
        const data = await response.json();
        console.log('Members data:', data);
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoads = async () => {
    try {
      const response = await fetch('/api/roads');
      if (response.ok) {
        const data = await response.json();
        console.log('Roads data:', data);
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
        console.log('Sub-roads data:', data);
        setSubRoads(data);
        setFilteredSubRoads(data);
      }
    } catch (error) {
      console.error('Error fetching sub-roads:', error);
    }
  };

  // Handle road filter change and update sub-roads
  const handleRoadFilterChange = (roadId: string) => {
    console.log('Road filter changed to:', roadId);
    setFilters({...filters, road: roadId, subRoad: ''}); // Reset sub-road when road changes
    if (roadId) {
      const filtered = subRoads.filter(subRoad => subRoad.road_id === roadId);
      console.log('Filtered sub-roads:', filtered);
      setFilteredSubRoads(filtered);
    } else {
      setFilteredSubRoads(subRoads);
    }
  };

  const filterMembers = () => {
    console.log('Filtering members with filters:', filters);
    let filtered = members.filter(member => !member.is_deleted);
    console.log('Initial filtered count:', filtered.length);

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(member =>
        member.full_name.toLowerCase().includes(search) ||
        member.nic.toLowerCase().includes(search) ||
        member.whatsapp_number?.toLowerCase().includes(search) ||
        member.occupation.toLowerCase().includes(search) ||
        member.address?.toLowerCase().includes(search) ||
        member.road_name?.toLowerCase().includes(search) ||
        member.sub_road_name?.toLowerCase().includes(search)
      );
    }

    // Resident type filter
    if (filters.residentType) {
      filtered = filtered.filter(member => member.resident_type === filters.residentType);
    }

    // Occupation filter
    if (filters.occupation) {
      filtered = filtered.filter(member => member.occupation === filters.occupation);
    }

    // Beneficiary filter
    if (filters.beneficiary) {
      filtered = filtered.filter(member => {
        const memberData = member as Member & { mahapola?: boolean; aswasuma?: boolean; wadihiti_dimana?: boolean };
        if (filters.beneficiary === 'mahapola') return memberData.mahapola;
        if (filters.beneficiary === 'aswasuma') return memberData.aswasuma;
        if (filters.beneficiary === 'wadihiti_dimana') return memberData.wadihiti_dimana;
        return false;
      });
    }

    // Road filter
    if (filters.road) {
      console.log('Applying road filter:', filters.road);
      const beforeCount = filtered.length;
      filtered = filtered.filter(member => {
        console.log(`Member ${member.full_name}: road_id=${member.road_id}, matches=${member.road_id === filters.road}`);
        return member.road_id === filters.road;
      });
      console.log(`Road filter: ${beforeCount} -> ${filtered.length} members`);
    }

    // Sub-road filter
    if (filters.subRoad) {
      console.log('Applying sub-road filter:', filters.subRoad);
      const beforeCount = filtered.length;
      filtered = filtered.filter(member => {
        console.log(`Member ${member.full_name}: sub_road_id=${member.sub_road_id}, matches=${member.sub_road_id === filters.subRoad}`);
        return member.sub_road_id === filters.subRoad;
      });
      console.log(`Sub-road filter: ${beforeCount} -> ${filtered.length} members`);
    }

    setFilteredMembers(filtered);
  };

  const handleEdit = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setEditingMember({ ...member });
      setShowEditModal(true);
      setShowModal(false); // Close details modal
    } else {
      showError('Member Not Found', 'Member not found. Please refresh the page and try again.');
    }
  };

  const handleDelete = async (memberId: string) => {
    // Find the member to delete for better confirmation message
    const member = members.find(m => m.id === memberId);
    const memberName = member ? member.full_name : 'this member';
    
    const confirmed = await confirm({
      title: 'Delete Member',
      message: `Are you sure you want to delete ${memberName}?\n\nThis action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    
    if (confirmed) {
      try {
        const response = await fetch(`/api/members/${memberId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          showSuccess(
            'Member Deleted',
            `${memberName} has been successfully removed from the system.`
          );
          // Refresh the members list
          fetchMembers();
          // Close modal if the deleted member was being viewed
          if (selectedMember && selectedMember.id === memberId) {
            closeModal();
          }
        } else {
          const errorData = await response.json();
          showError(
            'Deletion Failed',
            `Failed to delete member: ${errorData.error || 'Unknown error'}`
          );
        }
      } catch (error) {
        console.error('Error deleting member:', error);
        showError(
          'Network Error',
          'Failed to delete member. Please check your internet connection and try again.'
        );
      }
    }
  };

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMember(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingMember(null);
  };

  const handleEditHousehold = (member: Member) => {
    if (member.household_id) {
      setEditingHousehold({
        id: member.household_id,
        assessment_number: member.assessment_number || '',
        resident_type: member.resident_type || '',
        waste_disposal: member.waste_disposal || ''
      });
      setShowEditHouseholdModal(true);
      setShowModal(false); // Close details modal
    } else {
      showError('Household Not Found', 'No household information available for this member.');
    }
  };

  const closeEditHouseholdModal = () => {
    setEditingHousehold(null);
    setShowEditHouseholdModal(false);
  };

  const handleHouseholdChange = (field: string, value: string) => {
    if (editingHousehold) {
      setEditingHousehold({
        ...editingHousehold,
        [field]: value
      });
    }
  };

  const handleSaveHousehold = async () => {
    if (!editingHousehold) return;

    try {
      const response = await fetch(`/api/households/${editingHousehold.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessment_number: editingHousehold.assessment_number,
          resident_type: editingHousehold.resident_type,
          waste_disposal: editingHousehold.waste_disposal
        }),
      });

      if (response.ok) {
        const updatedHousehold = await response.json();
        
        // Update all members with the same household_id
        setMembers(members.map(m => {
          if (m.household_id === editingHousehold.id) {
            return {
              ...m,
              assessment_number: updatedHousehold.assessment_number,
              resident_type: updatedHousehold.resident_type,
              waste_disposal: updatedHousehold.waste_disposal,
              household_updated_at: updatedHousehold.updated_at
            };
          }
          return m;
        }));
        
        closeEditHouseholdModal();
        showSuccess(
          'Household Updated',
          'Household information has been updated successfully.'
        );
      } else {
        const errorData = await response.json();
        showError(
          'Update Failed',
          `Failed to update household: ${errorData.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error updating household:', error);
      showError(
        'Network Error',
        'Failed to update household. Please check your internet connection and try again.'
      );
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;

    try {
      // Only send member-specific fields, exclude household and address data
      const memberUpdateData = {
        household_id: editingMember.household_id,
        full_name: editingMember.full_name,
        name_with_initial: editingMember.name_with_initial,
        member_type: editingMember.member_type,
        nic: editingMember.nic,
        gender: editingMember.gender,
        age: editingMember.age,
        occupation: editingMember.occupation,
        school_name: editingMember.school_name,
        grade: editingMember.grade,
        university_name: editingMember.university_name,
        other_occupation: editingMember.other_occupation,
        offers_receiving: editingMember.offers_receiving,
        is_disabled: editingMember.is_disabled,
        land_house_status: editingMember.land_house_status,
        whatsapp_number: editingMember.whatsapp_number,
        workplace_address: editingMember.workplace_address,
        workplace_location: editingMember.workplace_location,
        is_drug_user: editingMember.is_drug_user,
        is_thief: editingMember.is_thief,
        mahapola: editingMember.mahapola,
        aswasuma: editingMember.aswasuma,
        wadihiti_dimana: editingMember.wadihiti_dimana
      };

      const response = await fetch(`/api/members/${editingMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberUpdateData),
      });

      if (response.ok) {
        const updatedMemberData = await response.json();
        
        // Find the original member to preserve household and address data
        const originalMember = members.find(m => m.id === editingMember.id);
        
        // Merge updated member data with preserved household/address data
        const completeUpdatedMember = {
          ...originalMember, // Preserve all original data
          ...updatedMemberData, // Override with updated member fields
          // Explicitly preserve household and address fields
          address: originalMember?.address,
          road_name: originalMember?.road_name,
          sub_road_name: originalMember?.sub_road_name,
          road_id: originalMember?.road_id,
          sub_road_id: originalMember?.sub_road_id,
          resident_type: originalMember?.resident_type,
          assessment_number: originalMember?.assessment_number,
          waste_disposal: originalMember?.waste_disposal,
          household_created_at: originalMember?.household_created_at,
          household_updated_at: originalMember?.household_updated_at
        };
        
        setMembers(members.map(m => m.id === editingMember.id ? completeUpdatedMember : m));
        closeEditModal();
        showSuccess(
          'Member Updated',
          'Member information has been updated successfully.'
        );
      } else {
        const errorData = await response.json();
        showError(
          'Update Failed',
          `Failed to update member: ${errorData.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error updating member:', error);
      showError(
        'Network Error',
        'Failed to update member. Please check your internet connection and try again.'
      );
    }
  };

  const handleEditChange = (field: string, value: string | number | boolean | null) => {
    if (editingMember) {
      setEditingMember({
        ...editingMember,
        [field]: value
      });
    }
  };

  const exportData = () => {
    const csv = [
      ['Location', 'Resident Type', 'Member Name', 'Occupation', 'Offers', 'NIC', 'WhatsApp', 'Workplace Address', 'Workplace Location'],
      ...filteredMembers.map(member => [
        `${member.road_name || ''} - ${member.sub_road_name || ''} - ${member.address || ''}`,
        member.resident_type || '',
        member.full_name,
        member.occupation,
        member.offers_receiving?.join(', ') || '',
        member.nic,
        member.whatsapp_number || '',
        member.workplace_address || '',
        member.workplace_location || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'village_members.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">View Member Details</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">View Member Details</h1>
        <p className="text-gray-600 mt-2">Manage and view all village member information</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Road Filter */}
          <select
            value={filters.road}
            onChange={(e) => handleRoadFilterChange(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Roads</option>
            {roads.map(road => (
              <option key={road.id} value={road.id}>{road.name}</option>
            ))}
          </select>

          {/* Sub-Road Filter */}
          <select
            value={filters.subRoad}
            onChange={(e) => setFilters({...filters, subRoad: e.target.value})}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={!filters.road}
          >
            <option value="">All Sub-Roads</option>
            {filteredSubRoads.map(subRoad => (
              <option key={subRoad.id} value={subRoad.id}>{subRoad.name}</option>
            ))}
          </select>

          {/* Resident Type Filter */}
          <select
            value={filters.residentType}
            onChange={(e) => setFilters({...filters, residentType: e.target.value})}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Resident Types</option>
            <option value="permanent">Permanent</option>
            <option value="rent">Rent</option>
          </select>

          {/* Occupation Filter */}
          <select
            value={filters.occupation}
            onChange={(e) => setFilters({...filters, occupation: e.target.value})}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Occupations</option>
            <option value="student">Student</option>
            <option value="university_student">University Student</option>
            <option value="teacher">Teacher</option>
            <option value="doctor">Doctor</option>
            <option value="engineer">Engineer</option>
            <option value="farmer">Farmer</option>
            <option value="business">Business</option>
            <option value="other">Other</option>
          </select>

          {/* Beneficiary Filter */}
          <select
            value={filters.beneficiary}
            onChange={(e) => setFilters({...filters, beneficiary: e.target.value})}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Beneficiaries</option>
            <option value="mahapola">Mahapola</option>
            <option value="aswasuma">Aswasuma</option>
            <option value="wadihiti_dimana">Wadihiti Dimana</option>
          </select>

          {/* Export Button */}
          <button
            onClick={exportData}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>

        {/* Clear Filters */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setFilters({
                residentType: '',
                occupation: '',
                beneficiary: '',
                road: '',
                subRoad: '',
              });
              setFilteredSubRoads(subRoads); // Reset sub-roads filter
            }}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-gray-600">
          Showing {filteredMembers.length} of {members.filter(m => !m.is_deleted).length} members
        </p>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resident Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Occupation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WhatsApp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr 
                  key={member.id} 
                  className={`${member.is_deleted ? 'bg-red-50' : 'hover:bg-gray-50 cursor-pointer'} transition-colors`}
                  onClick={() => handleMemberClick(member)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {member.full_name}
                        {member.is_drug_user && (
                          <span 
                            className="ml-2 w-2 h-2 bg-orange-500 rounded-full" 
                            title="Drug use monitoring"
                          />
                        )}
                        {member.is_thief && (
                          <span 
                            className="ml-2 w-2 h-2 bg-black rounded-full" 
                            title="Theft monitoring"
                          />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{member.name_with_initial}</div>
                      <div className="text-xs text-gray-400">{member.gender}, {member.age} years</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{member.address || 'N/A'}</div>
                      <div className="text-gray-500 text-xs">
                        {member.road_name && member.sub_road_name 
                          ? `${member.road_name} > ${member.sub_road_name}`
                          : member.road_name || 'No road info'
                        }
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      member.resident_type === 'permanent' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {member.resident_type || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.occupation?.replace('_', ' ').toUpperCase() || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {member.nic}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.whatsapp_number || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(member.id);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit member"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(member.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No members found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Member Details Modal */}
      {showModal && selectedMember && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => {
            // Close modal if clicking on backdrop
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div 
            className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl my-8 mx-auto min-h-fit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <User className="w-6 h-6 mr-2 text-blue-600" />
                Member Details
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Personal Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-sm text-gray-900 font-medium">{selectedMember.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name with Initial</label>
                    <p className="text-sm text-gray-900">{selectedMember.name_with_initial}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">NIC Number</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedMember.nic}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedMember.gender}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age</label>
                    <p className="text-sm text-gray-900">{selectedMember.age} years</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Type</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedMember.member_type === 'permanent' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedMember.member_type || 'N/A'}
                    </span>
                  </div>
                </div>
                {selectedMember.is_disabled && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <div className="flex">
                      <div className="shrink-0">
                        <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-orange-800">This member has special accessibility needs.</p>
                      </div>
                    </div>
                  </div>
                )}
                {selectedMember.is_drug_user && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-300 rounded-md">
                    <div className="flex">
                      <div className="shrink-0">
                        <div className="w-5 h-5 bg-orange-500 rounded-full"></div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-orange-800 font-medium">Drug use monitoring active</p>
                        <p className="text-xs text-orange-600 mt-1">This member is flagged for community safety awareness.</p>
                      </div>
                    </div>
                  </div>
                )}
                {selectedMember.is_thief && (
                  <div className="mt-3 p-3 bg-gray-100 border border-gray-400 rounded-md">
                    <div className="flex">
                      <div className="shrink-0">
                        <div className="w-5 h-5 bg-black rounded-full"></div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-900 font-medium">Theft monitoring active</p>
                        <p className="text-xs text-gray-700 mt-1">This member is flagged for community security awareness.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Professional Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
                  Professional Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Occupation</label>
                    <p className="text-sm text-gray-900">{selectedMember.occupation?.replace('_', ' ').toUpperCase() || 'N/A'}</p>
                  </div>
                  {selectedMember.school_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">School</label>
                      <p className="text-sm text-gray-900">{selectedMember.school_name}</p>
                    </div>
                  )}
                  {selectedMember.grade && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Grade</label>
                      <p className="text-sm text-gray-900">Grade {selectedMember.grade}</p>
                    </div>
                  )}
                  {selectedMember.university_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">University</label>
                      <p className="text-sm text-gray-900">{selectedMember.university_name}</p>
                    </div>
                  )}
                  {selectedMember.other_occupation && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Other Occupation Details</label>
                      <p className="text-sm text-gray-900">{selectedMember.other_occupation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-orange-600" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                    <p className="text-sm text-gray-900">{selectedMember.whatsapp_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedMember.whatsapp_number 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedMember.whatsapp_number ? 'Contactable' : 'No Contact'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Workplace Information */}
              {(selectedMember.workplace_address || selectedMember.workplace_location) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
                    Workplace Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedMember.workplace_address && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Workplace Address</label>
                        <p className="text-sm text-gray-900">{selectedMember.workplace_address}</p>
                      </div>
                    )}
                    {selectedMember.workplace_location && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Workplace Location</label>
                        <p className="text-sm text-gray-900">{selectedMember.workplace_location}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Home Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Home className="w-5 h-5 mr-2 text-red-600" />
                  Home Details
                </h4>
                
                {/* Address & Road Information */}
                <div className="mb-6">
                  <h5 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-green-600" />
                    Address & Location
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Home Address</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedMember.address || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Road</label>
                      <p className="text-sm text-gray-900">{selectedMember.road_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sub Road</label>
                      <p className="text-sm text-gray-900">{selectedMember.sub_road_name || 'Main Road'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Location</label>
                      <p className="text-sm text-blue-600">
                        {selectedMember.road_name && selectedMember.sub_road_name 
                          ? `${selectedMember.road_name} → ${selectedMember.sub_road_name} → ${selectedMember.address || 'No specific address'}`
                          : selectedMember.road_name 
                            ? `${selectedMember.road_name} → ${selectedMember.address || 'No specific address'}`
                            : selectedMember.address || 'No location information'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Residence Information */}
                <div className="mb-6">
                  <h5 className="text-md font-medium text-gray-800 mb-3">Residence Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Resident Type</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedMember.resident_type === 'permanent' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedMember.resident_type || 'Unknown'}
                      </span>
                    </div>
                    {selectedMember.assessment_number && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assessment Number</label>
                        <p className="text-sm text-gray-900 font-mono">{selectedMember.assessment_number}</p>
                      </div>
                    )}
                    {selectedMember.waste_disposal && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Waste Disposal</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedMember.waste_disposal === 'local_council' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {selectedMember.waste_disposal === 'local_council' ? 'Local Council' : 'Home Disposal'}
                        </span>
                      </div>
                    )}
                    {selectedMember.land_house_status && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Land/House Status</label>
                        <p className="text-sm text-gray-900 capitalize">{selectedMember.land_house_status.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Household ID</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedMember.household_id}</p>
                    </div>
                    {selectedMember.household_created_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Household Registered</label>
                        <p className="text-sm text-gray-900">{new Date(selectedMember.household_created_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Government Offers & Benefits */}
                {selectedMember.offers_receiving && selectedMember.offers_receiving.length > 0 && (
                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-3">Government Offers & Benefits</h5>
                    <div className="space-y-2">
                      {selectedMember.offers_receiving.map((offer, index) => (
                        <span key={index} className="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full mr-2 mb-2">
                          {offer}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      This member is currently receiving {selectedMember.offers_receiving.length} government benefit(s)
                    </p>
                  </div>
                )}
                
                {/* Government Benefits (Mahapola, Aswasuma, Wadihiti Dimana) */}
                {(selectedMember.mahapola || selectedMember.aswasuma || selectedMember.wadihiti_dimana) && (
                  <div className="mt-4">
                    <h5 className="text-md font-medium text-gray-800 mb-3">Government Benefits</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.mahapola && (
                        <span className="inline-flex px-3 py-1 text-sm bg-indigo-100 text-indigo-800 rounded-full">
                          Mahapola
                        </span>
                      )}
                      {selectedMember.aswasuma && (
                        <span className="inline-flex px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full">
                          Aswasuma
                        </span>
                      )}
                      {selectedMember.wadihiti_dimana && (
                        <span className="inline-flex px-3 py-1 text-sm bg-pink-100 text-pink-800 rounded-full">
                          Wadihiti Dimana
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {(!selectedMember.offers_receiving || selectedMember.offers_receiving.length === 0) && (
                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-3">Government Offers & Benefits</h5>
                    <div className="bg-gray-200 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">No government offers or benefits currently received</p>
                    </div>
                  </div>
                )}
              </div>

              {/* System Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                  System Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  {selectedMember.created_at && (
                    <div>
                      <label className="block font-medium text-gray-700">Created</label>
                      <p>{new Date(selectedMember.created_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedMember.updated_at && (
                    <div>
                      <label className="block font-medium text-gray-700">Last Updated</label>
                      <p>{new Date(selectedMember.updated_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <label className="block font-medium text-gray-700">Member ID</label>
                    <p className="font-mono">{selectedMember.id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg space-x-4">
              <button
                onClick={() => {
                  handleEdit(selectedMember.id);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Member
              </button>
              <button
                onClick={() => {
                  handleEditHousehold(selectedMember);
                }}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Edit Household
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && editingMember && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeEditModal();
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
                <Edit className="w-6 h-6 mr-2 text-blue-600" />
                Edit Member Information
              </h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close edit modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body - Edit Form */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Personal Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={editingMember.full_name}
                      onChange={(e) => handleEditChange('full_name', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name with Initial</label>
                    <input
                      type="text"
                      value={editingMember.name_with_initial}
                      onChange={(e) => handleEditChange('name_with_initial', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIC Number *</label>
                    <input
                      type="text"
                      value={editingMember.nic}
                      onChange={(e) => handleEditChange('nic', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                    <input
                      type="number"
                      value={editingMember.age}
                      onChange={(e) => handleEditChange('age', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="120"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <select
                      value={editingMember.gender}
                      onChange={(e) => handleEditChange('gender', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member Type</label>
                    <select
                      value={editingMember.member_type}
                      onChange={(e) => handleEditChange('member_type', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Type</option>
                      <option value="head">Head of Household</option>
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingMember.is_disabled}
                      onChange={(e) => handleEditChange('is_disabled', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Has accessibility needs</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingMember.is_drug_user || false}
                      onChange={(e) => handleEditChange('is_drug_user', e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-600">Drug use monitoring</span>
                    <span className="ml-2 text-xs text-orange-500 italic">(orange dot)</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingMember.is_thief || false}
                      onChange={(e) => handleEditChange('is_thief', e.target.checked)}
                      className="rounded border-gray-300 text-gray-800 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-300 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-600">Theft monitoring</span>
                    <span className="ml-2 text-xs text-gray-800 italic">(black dot)</span>
                  </label>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
                  Professional Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation *</label>
                    <select
                      value={editingMember.occupation}
                      onChange={(e) => handleEditChange('occupation', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Occupation</option>
                      <option value="student">Student</option>
                      <option value="university_student">University Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="doctor">Doctor</option>
                      <option value="engineer">Engineer</option>
                      <option value="farmer">Farmer</option>
                      <option value="business">Business</option>
                      <option value="unemployed">Unemployed</option>
                      <option value="retired">Retired</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  {(editingMember.occupation === 'student') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                        <input
                          type="text"
                          value={editingMember.school_name || ''}
                          onChange={(e) => handleEditChange('school_name', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                        <input
                          type="number"
                          value={editingMember.grade || ''}
                          onChange={(e) => handleEditChange('grade', parseInt(e.target.value) || null)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          max="13"
                        />
                      </div>
                    </>
                  )}
                  
                  {(editingMember.occupation === 'university_student') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">University Name</label>
                      <input
                        type="text"
                        value={editingMember.university_name || ''}
                        onChange={(e) => handleEditChange('university_name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                  
                  {(editingMember.occupation === 'other') && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Other Occupation Details</label>
                      <input
                        type="text"
                        value={editingMember.other_occupation || ''}
                        onChange={(e) => handleEditChange('other_occupation', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Please specify occupation"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-orange-600" />
                  Contact Information
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={editingMember.whatsapp_number || ''}
                    onChange={(e) => handleEditChange('whatsapp_number', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="07XXXXXXXX"
                  />
                </div>
              </div>

              {/* Workplace Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
                  Workplace Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Workplace Address</label>
                    <input
                      type="text"
                      value={editingMember.workplace_address || ''}
                      onChange={(e) => handleEditChange('workplace_address', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter workplace address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Workplace Location</label>
                    <input
                      type="text"
                      value={editingMember.workplace_location || ''}
                      onChange={(e) => handleEditChange('workplace_location', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter workplace location/city"
                    />
                  </div>
                </div>
              </div>

              {/* Land and House Status */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <Home className="w-5 h-5 mr-2 text-green-600" />
                  Land & House Status
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Land & House Status</label>
                  <select
                    value={editingMember.land_house_status || ''}
                    onChange={(e) => handleEditChange('land_house_status', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Status</option>
                    <option value="plot_of_land">Plot of Land</option>
                    <option value="no_house">No House</option>
                    <option value="no_house_and_land">No House and Land</option>
                  </select>
                </div>
              </div>

              {/* Government Benefits */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                  Government Benefits
                </h4>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingMember.mahapola || false}
                      onChange={(e) => handleEditChange('mahapola', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Mahapola</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingMember.aswasuma || false}
                      onChange={(e) => handleEditChange('aswasuma', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Aswasuma</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingMember.wadihiti_dimana || false}
                      onChange={(e) => handleEditChange('wadihiti_dimana', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Wadihiti Dimana</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg space-x-4">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <User className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Household Edit Modal */}
      {showEditHouseholdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Home className="w-5 h-5 mr-2 text-green-600" />
                Edit Household Details
              </h3>
              <button
                onClick={() => setShowEditHouseholdModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assessment Number
                  </label>
                  <input
                    type="text"
                    value={editingHousehold?.assessment_number || ''}
                    onChange={(e) => editingHousehold && setEditingHousehold({
                      ...editingHousehold,
                      assessment_number: e.target.value
                    })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter assessment number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resident Type
                  </label>
                  <select
                    value={editingHousehold?.resident_type || ''}
                    onChange={(e) => editingHousehold && setEditingHousehold({
                      ...editingHousehold,
                      resident_type: e.target.value
                    })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select resident type</option>
                    <option value="permanent">Permanent</option>
                    <option value="temporary">Temporary</option>
                    <option value="rental">Rental</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waste Disposal
                  </label>
                  <select
                    value={editingHousehold?.waste_disposal || ''}
                    onChange={(e) => editingHousehold && setEditingHousehold({
                      ...editingHousehold,
                      waste_disposal: e.target.value
                    })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select waste disposal method</option>
                    <option value="local_council">Local Council</option>
                    <option value="home">Home</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg space-x-4">
              <button
                onClick={() => setShowEditHouseholdModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHousehold}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Save Household
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}