"use client";

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

interface Member {
  id?: number;
  fullName: string;
  nameWithInitial: string;
  memberType: string;
  nic: string;
  gender: string;
  age: number;
  occupation: string;
  workplace: string;
  schoolName: string;
  grade: string;
  universityName: string;
  otherOccupation: string;
  offersReceiving: string[];
  isDisabled: boolean;
  landHouseStatus: string;
  whatsappNumber: string;
  isDrugUser: boolean;
  isThief: boolean;
  mahapola: boolean;
  aswasuma: boolean;
  wadihitiDimana: boolean;
}

export default function AddDetails() {
  const { showSuccess, showError } = useToast();
  const [step, setStep] = useState(1);
  const [homeType, setHomeType] = useState('');
  const [selectedRoad, setSelectedRoad] = useState('');
  const [selectedSubRoad, setSelectedSubRoad] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');

  const [roads, setRoads] = useState([]);
  const [subRoads, setSubRoads] = useState([]);
  const [addresses, setAddresses] = useState([]);

  // Home details
  const [homeDetails, setHomeDetails] = useState({
    assessmentNumber: '',
    residentType: '',
    wasteDisposal: '',
    numberOfMembers: 1,
  });

  // Members array
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMember, setCurrentMember] = useState<Member>({
    fullName: '',
    nameWithInitial: '',
    memberType: 'permanent',
    nic: '',
    gender: '',
    age: 0,
    occupation: '',
    workplace: '',
    schoolName: '',
    grade: '',
    universityName: '',
    otherOccupation: '',
    offersReceiving: [],
    isDisabled: false,
    landHouseStatus: '',
    whatsappNumber: '',
    isDrugUser: false,
    isThief: false,
    mahapola: false,
    aswasuma: false,
    wadihitiDimana: false,
  });

  useEffect(() => {
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

    fetchRoads();
  }, []);

  const fetchSubRoads = async (roadId: string) => {
    try {
      const response = await fetch(`/api/roads/${roadId}/sub-roads`);
      if (response.ok) {
        const data = await response.json();
        setSubRoads(data);
        setSelectedSubRoad('');
        setSelectedAddress('');
        
        // If no sub-roads exist, fetch addresses directly from main road
        if (data.length === 0) {
          fetchMainRoadAddresses(roadId);
        } else {
          setAddresses([]); // Clear addresses when road has sub-roads
        }
      }
    } catch (error) {
      console.error('Error fetching sub-roads:', error);
    }
  };

  const fetchMainRoadAddresses = async (roadId: string) => {
    try {
      const response = await fetch(`/api/roads/${roadId}/addresses`);
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
        setSelectedAddress('');
      }
    } catch (error) {
      console.error('Error fetching main road addresses:', error);
    }
  };

  const fetchAddresses = async (roadId: string, subRoadId: string) => {
    try {
      const response = await fetch(`/api/roads/${roadId}/sub-roads/${subRoadId}/addresses`);
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
        setSelectedAddress('');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const calculateAgeFromNIC = (nic: string) => {
    if (!nic || nic.trim() === '') return 0;
    
    const currentYear = new Date().getFullYear();
    
    // New NIC format (12 digits): YYYYMMDDXXXX
    if (nic.length >= 12) {
      const year = parseInt(nic.substring(0, 4));
      if (year >= 1900 && year <= currentYear) {
        return currentYear - year;
      }
    }
    
    // Old NIC format (9 digits + V): YYDDDXXXXX or YYDDDXXXXV
    if (nic.length >= 2) {
      const yearPrefix = parseInt(nic.substring(0, 2));
      // Assume 19XX for years 20-99, and 20XX for years 00-19
      const birthYear = yearPrefix >= 20 ? 1900 + yearPrefix : 2000 + yearPrefix;
      if (birthYear <= currentYear) {
        return currentYear - birthYear;
      }
    }
    
    return 0;
  };

  const handleNICChange = (nic: string) => {
    setCurrentMember(prev => ({
      ...prev,
      nic,
      age: nic.trim() !== '' ? calculateAgeFromNIC(nic) : 0
    }));
  };

  const addMember = () => {
    if (currentMember.fullName) {
      setMembers([...members, { ...currentMember, id: Date.now() }]);
      setCurrentMember({
        id: 0,
        fullName: '',
        nameWithInitial: '',
        memberType: 'permanent',
        nic: '',
        gender: '',
        age: 0,
        occupation: '',
        workplace: '',
        schoolName: '',
        grade: '',
        universityName: '',
        otherOccupation: '',
        offersReceiving: [],
        isDisabled: false,
        landHouseStatus: '',
        whatsappNumber: '',
        isDrugUser: false,
        isThief: false,
        mahapola: false,
        aswasuma: false,
        wadihitiDimana: false,
      });
    }
  };

  const removeMember = (memberId: number) => {
    setMembers(members.filter(member => member.id !== memberId));
  };

  const submitHousehold = async () => {
    try {
      const response = await fetch('/api/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeDetails,
          members,
          addressId: selectedAddress,
        }),
      });

      if (response.ok) {
        showSuccess(
          'Household Saved Successfully',
          `Household with ${members.length} member${members.length !== 1 ? 's' : ''} has been saved to the database.`
        );
        // Reset form
        setStep(1);
        setHomeType('');
        setSelectedRoad('');
        setSelectedSubRoad('');
        setSelectedAddress('');
        setHomeDetails({
          assessmentNumber: '',
          residentType: '',
          wasteDisposal: '',
          numberOfMembers: 1,
        });
        setMembers([]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'An error occurred while saving household details.';
        
        // Provide specific guidance based on error type
        let detailedMessage = errorMessage;
        if (errorMessage.includes('Duplicate NIC')) {
          detailedMessage += '\n\nPlease check the NIC numbers and remove any members that already exist in the system.';
        } else if (errorMessage.includes('unique constraint')) {
          detailedMessage += '\n\nOne or more members already exist in the system. Please verify the NIC numbers.';
        } else if (errorMessage.includes('required')) {
          detailedMessage += '\n\nPlease ensure all required fields are filled in correctly.';
        }
        
        showError(
          'Failed to Save Household',
          detailedMessage
        );
      }
    } catch (error) {
      console.error('Error submitting household:', error);
      showError(
        'Submission Error',
        'A network error occurred while saving. Please check your connection and try again.'
      );
    }
  };

  const occupations = [
    'student', 'university_student', 'business', 'doctor', 'teacher',
    'engineer', 'accountant', 'nurse', 'farmer', 'driver', 'retired',
    'abroad', 'self_employment', 'no', 'other'
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Add Household Details</h1>

      {step === 1 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Step 1: Home Selection</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Home Type
            </label>
            <select
              value={homeType}
              onChange={(e) => setHomeType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Home Type</option>
              <option value="new">New Home</option>
              <option value="existing">Existing Home</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Road
              </label>
              <select
                value={selectedRoad}
                onChange={(e) => {
                  setSelectedRoad(e.target.value);
                  if (e.target.value) {
                    fetchSubRoads(e.target.value);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Road</option>
                {roads.map((road: {id: string, name: string}) => (
                  <option key={road.id} value={road.id}>{road.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sub Road
              </label>
              <select
                value={selectedSubRoad}
                onChange={(e) => {
                  setSelectedSubRoad(e.target.value);
                  if (e.target.value && selectedRoad) {
                    fetchAddresses(selectedRoad, e.target.value);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={!selectedRoad || subRoads.length === 0}
              >
                <option value="">{subRoads.length === 0 ? 'No Sub Roads' : 'Select Sub Road'}</option>
                {subRoads.map((subRoad: {id: string, name: string}) => (
                  <option key={subRoad.id} value={subRoad.id}>{subRoad.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <select
                value={selectedAddress}
                onChange={(e) => setSelectedAddress(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={!selectedRoad || (subRoads.length > 0 && !selectedSubRoad)}
              >
                <option value="">Select Address</option>
                {addresses.map((address: {id: string, address: string}) => (
                  <option key={address.id} value={address.id}>{address.address}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Members
              </label>
              <input
                type="number"
                min="1"
                value={homeDetails.numberOfMembers}
                onChange={(e) => setHomeDetails({ ...homeDetails, numberOfMembers: parseInt(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assessment Number (Optional)
              </label>
              <input
                type="text"
                value={homeDetails.assessmentNumber}
                onChange={(e) => setHomeDetails({ ...homeDetails, assessmentNumber: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resident Type
              </label>
              <select
                value={homeDetails.residentType}
                onChange={(e) => setHomeDetails({ ...homeDetails, residentType: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Type</option>
                <option value="permanent">Permanent</option>
                <option value="rent">Rent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waste Disposal
              </label>
              <select
                value={homeDetails.wasteDisposal}
                onChange={(e) => setHomeDetails({ ...homeDetails, wasteDisposal: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Method</option>
                <option value="local_council">Local Council</option>
                <option value="home">Home</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => setStep(2)}
              disabled={!homeType || !selectedAddress || !homeDetails.residentType || !homeDetails.wasteDisposal}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Add Members
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Step 2: Add Member Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={currentMember.fullName}
                  onChange={(e) => setCurrentMember({ ...currentMember, fullName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name with Initial
                </label>
                <input
                  type="text"
                  value={currentMember.nameWithInitial}
                  onChange={(e) => setCurrentMember({ ...currentMember, nameWithInitial: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Type
                </label>
                <select
                  value={currentMember.memberType}
                  onChange={(e) => setCurrentMember({ ...currentMember, memberType: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="permanent">Permanent</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIC
                </label>
                <input
                  type="text"
                  value={currentMember.nic}
                  onChange={(e) => handleNICChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={currentMember.gender}
                  onChange={(e) => setCurrentMember({ ...currentMember, gender: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age {currentMember.nic ? '(Auto-calculated from NIC)' : '(Optional)'}
                </label>
                <input
                  type="number"
                  value={currentMember.age || ''}
                  onChange={(e) => setCurrentMember({ ...currentMember, age: parseInt(e.target.value) || 0 })}
                  readOnly={!!currentMember.nic}
                  className={`w-full p-2 border border-gray-300 rounded-md ${currentMember.nic ? 'bg-gray-100' : ''}`}
                  placeholder="Enter age manually"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occupation
                </label>
                <select
                  value={currentMember.occupation}
                  onChange={(e) => setCurrentMember({ ...currentMember, occupation: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Occupation</option>
                  {occupations.map(occ => (
                    <option key={occ} value={occ}>{occ.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Workplace field for working occupations */}
              {currentMember.occupation && !['student', 'university_student', 'no', 'abroad'].includes(currentMember.occupation) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workplace
                  </label>
                  <input
                    type="text"
                    value={currentMember.workplace}
                    onChange={(e) => setCurrentMember({ ...currentMember, workplace: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter workplace name or location"
                  />
                </div>
              )}

              {currentMember.occupation === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Name
                    </label>
                    <input
                      type="text"
                      value={currentMember.schoolName}
                      onChange={(e) => setCurrentMember({ ...currentMember, schoolName: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="13"
                      value={currentMember.grade}
                      onChange={(e) => setCurrentMember({ ...currentMember, grade: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </>
              )}

              {currentMember.occupation === 'university_student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    University Name
                  </label>
                  <input
                    type="text"
                    value={currentMember.universityName}
                    onChange={(e) => setCurrentMember({ ...currentMember, universityName: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}

              {currentMember.occupation === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Other Occupation
                  </label>
                  <input
                    type="text"
                    value={currentMember.otherOccupation}
                    onChange={(e) => setCurrentMember({ ...currentMember, otherOccupation: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={currentMember.whatsappNumber}
                  onChange={(e) => setCurrentMember({ ...currentMember, whatsappNumber: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Land and House Status
                </label>
                <select
                  value={currentMember.landHouseStatus}
                  onChange={(e) => setCurrentMember({ ...currentMember, landHouseStatus: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Status</option>
                  <option value="plot_of_land">Plot of Land</option>
                  <option value="no_house">No House</option>
                  <option value="no_house_and_land">No House and Land</option>
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={currentMember.isDisabled}
                  onChange={(e) => setCurrentMember({ ...currentMember, isDisabled: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Disabled</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={currentMember.isDrugUser}
                  onChange={(e) => setCurrentMember({ ...currentMember, isDrugUser: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Drug use monitoring</span>
                <span className="ml-2 text-xs text-orange-500 italic">(shown with orange dot)</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={currentMember.isThief}
                  onChange={(e) => setCurrentMember({ ...currentMember, isThief: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Theft monitoring</span>
                <span className="ml-2 text-xs text-gray-800 italic">(shown with black dot)</span>
              </label>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Government Benefits</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={currentMember.mahapola}
                    onChange={(e) => setCurrentMember({ ...currentMember, mahapola: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Mahapola</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={currentMember.aswasuma}
                    onChange={(e) => setCurrentMember({ ...currentMember, aswasuma: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Aswasuma</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={currentMember.wadihitiDimana}
                    onChange={(e) => setCurrentMember({ ...currentMember, wadihitiDimana: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Wadihiti Dimana</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={addMember}
                disabled={!currentMember.fullName}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Add Member
              </button>
              <button
                onClick={() => setStep(1)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back
              </button>
            </div>
          </div>

          {members.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Added Members ({members.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">NIC</th>
                      <th className="px-4 py-2 text-left">Age</th>
                      <th className="px-4 py-2 text-left">Occupation</th>
                      <th className="px-4 py-2 text-left">Workplace</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member: Member) => (
                      <tr key={member.id} className="border-t">
                        <td className="px-4 py-2">{member.fullName}</td>
                        <td className="px-4 py-2">{member.nic}</td>
                        <td className="px-4 py-2">{member.age}</td>
                        <td className="px-4 py-2">{member.occupation}</td>
                        <td className="px-4 py-2">{member.workplace || '-'}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => removeMember(member.id!)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <button
                  onClick={submitHousehold}
                  disabled={members.length === 0}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Submit Household
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}