import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import MainContent from "../components/MainContent";
import { useParams } from 'react-router-dom';

const HomePage = () => {
  const { voyageId, productCode } = useParams();
  const [selectedTab, setSelectedTab] = useState('Voyages');

  console.log(productCode);
  

  useEffect(() => {
    if (voyageId) {
      setSelectedTab('VoyageDetails');
    }else if(productCode){
      setSelectedTab('AllCodeDetails');
    }else{
      setSelectedTab("Voyages");
    }
  }, [voyageId, productCode]);

  return (
    <div className='flex h-screen'>
      <Sidebar setSelectedTab={setSelectedTab} />
      <div className='flex-1 py-5 px-10 overflow-y-auto h-screens bg-gray-50'>
        <MainContent selectedTab={selectedTab} />
      </div>
    </div>
  );
};

export default HomePage;
