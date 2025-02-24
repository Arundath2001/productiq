import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import MainContent from "../components/MainContent";
import { useParams, useLocation } from 'react-router-dom';

const HomePage = () => {
  const { voyageId, productCode } = useParams();
  const location = useLocation();  // Track route changes
  const [selectedTab, setSelectedTab] = useState('Voyages');

  useEffect(() => {
    if (voyageId) {
      setSelectedTab("VoyageDetails");
    } else if (productCode) {
      setSelectedTab("AllCodeDetails");
    } else if (location.pathname === "/completed") { 
      setSelectedTab("Completed Voyages");
    } else {
      setSelectedTab("Voyages");
    }
  }, [voyageId, productCode, location.pathname]);  // Listen for route changes

  return (
    <div className='flex h-screen'>
      <Sidebar setSelectedTab={setSelectedTab} />
      <div className='flex-1 py-5 px-10 overflow-y-auto h-screen bg-gray-100'>
        <MainContent selectedTab={selectedTab} />
      </div>
    </div>
  );
};

export default HomePage;
