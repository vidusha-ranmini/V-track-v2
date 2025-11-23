"use client";

import { useState } from 'react';
import Sidebar from './layout/Sidebar';
import DashboardOverview from './dashboard/DashboardOverview';
import AddDetails from './forms/AddDetails';
import ViewDetails from './tables/ViewDetails';
import AddBusiness from './forms/AddBusiness';
import RoadLamps from './infrastructure/RoadLamps';
import RoadDetails from './infrastructure/RoadDetails';

type ActivePage = 'dashboard' | 'add-details' | 'view-details' | 'add-business' | 'road-lamps' | 'road-details';

export default function Dashboard() {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');

  const handlePageChange = (page: string) => {
    setActivePage(page as ActivePage);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'add-details':
        return <AddDetails />;
      case 'view-details':
        return <ViewDetails />;
      case 'add-business':
        return <AddBusiness />;
      case 'road-lamps':
        return <RoadLamps />;
      case 'road-details':
        return <RoadDetails />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activePage={activePage} onPageChange={handlePageChange} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {renderActivePage()}
        </div>
      </main>
    </div>
  );
}