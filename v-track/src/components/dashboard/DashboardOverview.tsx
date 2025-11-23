"use client";

import { useEffect, useState } from 'react';
import { Users, Home, Building, Lightbulb, PieChart, BarChart3, TrendingUp } from 'lucide-react';
import ActivityLogs from './ActivityLogs';

interface DashboardStats {
  totalMembers: number;
  totalHouseholds: number;
  totalBusinesses: number;
  totalRoadLamps: number;
  workingLamps: number;
  brokenLamps: number;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface MemberStats {
  genderStats: ChartData[];
  ageGroups: ChartData[];
  memberTypes: ChartData[];
  occupations: ChartData[];
  disabilities: ChartData[];
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalHouseholds: 0,
    totalBusinesses: 0,
    totalRoadLamps: 0,
    workingLamps: 0,
    brokenLamps: 0,
  });
  const [memberStats, setMemberStats] = useState<MemberStats>({
    genderStats: [],
    ageGroups: [],
    memberTypes: [],
    occupations: [],
    disabilities: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchDashboardStats(),
      fetchMemberStats()
    ]);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMemberStats = async () => {
    try {
      const response = await fetch('/api/dashboard/member-stats');
      if (response.ok) {
        const data = await response.json();
        setMemberStats(data);
      }
    } catch (error) {
      console.error('Error fetching member stats:', error);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = "blue",
    subtitle 
  }: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color?: string;
    subtitle?: string;
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of village data and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Households"
          value={stats.totalHouseholds}
          icon={Home}
          color="green"
        />
        <StatCard
          title="Total Businesses"
          value={stats.totalBusinesses}
          icon={Building}
          color="purple"
        />
        <StatCard
          title="Road Lamps"
          value={stats.totalRoadLamps}
          icon={Lightbulb}
          color="yellow"
          subtitle={`${stats.workingLamps} working, ${stats.brokenLamps} broken`}
        />
      </div>

      {/* Member Statistics Charts */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Member Demographics & Statistics</h3>
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Gender Distribution */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <PieChart className="w-4 h-4 mr-2 text-blue-600" />
                Gender Distribution
              </h4>
              <div className="space-y-3">
                {memberStats.genderStats.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-900 mr-2">{item.value}</span>
                      <span className="text-xs text-gray-500">
                        ({((item.value / stats.totalMembers) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Total: <span className="font-bold">{stats.totalMembers}</span> members
                </div>
              </div>
            </div>

            {/* Age Groups */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-green-600" />
                Age Groups
              </h4>
              <div className="space-y-3">
                {memberStats.ageGroups.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700">{item.label} years</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-900 mr-2">{item.value}</span>
                      <span className="text-xs text-gray-500">
                        ({((item.value / stats.totalMembers) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Average age distribution across all members
                </div>
              </div>
            </div>

            {/* Member Types */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="w-4 h-4 mr-2 text-purple-600" />
                Member Types
              </h4>
              <div className="space-y-3">
                {memberStats.memberTypes.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-900 mr-2">{item.value}</span>
                      <span className="text-xs text-gray-500">
                        ({((item.value / stats.totalMembers) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Residency status classification
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Occupations and Disabilities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Occupations */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Building className="w-4 h-4 mr-2 text-orange-600" />
              Top Occupations
            </h4>
            <div className="space-y-3">
              {memberStats.occupations.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="flex items-center min-w-0 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full mr-3 flex-shrink-0" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700 truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center ml-4">
                      <span className="text-lg font-bold text-gray-900 mr-2">{item.value}</span>
                      <span className="text-xs text-gray-500">
                        ({((item.value / stats.totalMembers) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {memberStats.occupations.length > 6 && (
                <div className="text-sm text-gray-500 text-center pt-2 border-t">
                  +{memberStats.occupations.length - 6} more occupations
                </div>
              )}
            </div>
          </div>

          {/* Disability Status & Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Home className="w-4 h-4 mr-2 text-red-600" />
              Community Summary
            </h4>
            
            {/* Disability Stats */}
            <div className="mb-6">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Disability Status</h5>
              <div className="space-y-2">
                {memberStats.disabilities.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-900 mr-2">{item.value}</span>
                      <span className="text-xs text-gray-500">
                        ({((item.value / stats.totalMembers) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="pt-4 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Quick Overview</h5>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalHouseholds}</div>
                  <div className="text-xs text-blue-700">Households</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.totalBusinesses}</div>
                  <div className="text-xs text-green-700">Businesses</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{stats.totalRoadLamps}</div>
                  <div className="text-xs text-gray-600">
                    Road Lamps ({stats.workingLamps} working, {stats.brokenLamps} need repair)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Logs Section */}
      <div className="mt-8">
        <ActivityLogs showRecentLogsOnly={true} maxItems={5} />
      </div>
    </div>
  );
}