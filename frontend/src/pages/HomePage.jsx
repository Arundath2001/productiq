import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import MainContent from "../components/MainContent";
import { useParams, useLocation } from 'react-router-dom';

const HomePage = () => {
  const { voyageId, companyCode, productCode } = useParams();
  const location = useLocation();
  
  const [selectedTab, setSelectedTab] = useState('Voyages');

  useEffect(() => {
    const path = location.pathname;
    
    // Handle /completed-voyage/:voyageId/companies/:companyCode
    if (path.match(/^\/completed-voyage\/[^\/]+\/companies\/[^\/]+$/)) {
      setSelectedTab("CompletedVoyageDetails");
    }
    // Handle /completed-voyage/:voyageId/companies
    else if (path.match(/^\/completed-voyage\/[^\/]+\/companies$/)) {
      setSelectedTab("CompletedVoyageByCompany");
    }
    // Handle /voyage/:voyageId/companies/:companyCode
    else if (path.match(/^\/voyage\/[^\/]+\/companies\/[^\/]+$/)) {
      setSelectedTab("VoyageDetails");
    }
    // Handle /voyage/:voyageId/companies
    else if (path.match(/^\/voyage\/[^\/]+\/companies$/)) {
      setSelectedTab("VoyageByCompany");
    }
    // Handle /voyages/getproducts/:productCode
    else if (path.match(/^\/voyages\/getproducts\/[^\/]+$/)) {
      setSelectedTab("AllCodeDetails");
    }
    // Handle other routes
    else if (path === "/completed") {
      setSelectedTab("Completed Voyages");
    }
    else if (path === "/productqr") {
      setSelectedTab("Product QR");
    }
    else if (path === "/employee") {
      setSelectedTab("Employee");
    }
    else if (path === "/client") {
      setSelectedTab("Client");
    }
    else if (path === "/allBills" || path === "/allbills") {
      setSelectedTab("All Bills");
    }
    else if (path === "/sendNotification") {
      setSelectedTab("Send Notification");
    }
    else {
      setSelectedTab("Voyages");
    }
  }, [location.pathname]);

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