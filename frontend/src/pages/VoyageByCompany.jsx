import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVoyageStore } from '../store/useVoyageStore.js';
import { Loader } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import images from '../lib/images.js';
import { exportVoyageData } from '../lib/excel.js';
import ConfirmAlert from '../components/ConfirmAlert.jsx';

const VoyageByCompany = () => {
  const { voyageId } = useParams();
  const navigate = useNavigate();
  
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  const {
    companiesSummary,
    isCompaniesSummaryLoading,
    getCompaniesSummaryByVoyage,
    exportVoyage,
    getAllVoyageProducts,
  } = useVoyageStore();

  useEffect(() => {
    if (voyageId) {
      getCompaniesSummaryByVoyage(voyageId);
    }
  }, [voyageId, getCompaniesSummaryByVoyage]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  const handleViewClick = (companyCode) => {
    navigate(`/voyage/${voyageId}/companies/${companyCode}`);
  };

  const handleExport = () => {
    setShowExportConfirm(true);
  };

  const confirmExport = async () => {
  try {
    const allProducts = await getAllVoyageProducts(voyageId);
    
    exportVoyageData(
      allProducts, 
      companiesSummary.voyageInfo.voyageName,
      voyageId
    );
    
    await exportVoyage(voyageId);

    setShowExportConfirm(false);
    
    window.location.href = "/completed";
  } catch (error) {
    console.error('Export failed:', error);
    setShowExportConfirm(false);
  }
};

  if (isCompaniesSummaryLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-15 animate-spin" />
      </div>
    );
  }

  if (!companiesSummary) {
    return <div>No companies data available.</div>;
  }

  return (
    <div>
      <PageHeader
        mainHead={`${companiesSummary.voyageInfo.voyageName}`}
        subText={`${companiesSummary.summary.totalCompanies} Companies | ${companiesSummary.summary.grandTotalItems} Items`}
        weight={companiesSummary.summary.grandTotalWeight}
        onExport={handleExport}
      />

      <div className="mt-5">
        {companiesSummary.companies.length > 0 ? (
          companiesSummary.companies.map((company, index) => (
            <div
              key={index}
              className="flex rounded-xl items-center justify-between bg-white px-4 py-2.5 mb-2.5"
            >
              <div className="flex flex-col">
                <p className="text-black text-sm font-medium">
                  {company.companyCode}
                </p>
                <p className="text-gray-600 text-xs">
                  {company.itemCount} Items | Weight: {company.totalWeight}kg
                </p>
              </div>

              <div className="flex gap-3 items-center">
                <p className="text-sm text-gray-600">
                  Latest Upload: {formatDate(company.latestUpload)}
                </p>
                
                <div
                  onClick={() => handleViewClick(company.companyCode)}
                  className="rounded-xl border px-2.5 py-1.5 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  View
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center mt-10">
            <img
              src={images.file}
              alt="No Data"
              className="w-32 h-32 mb-4 opacity-75"
            />
            <p className="text-lg font-semibold text-gray-700">
              No companies found for this voyage!
            </p>
          </div>
        )}
      </div>

      {showExportConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <ConfirmAlert
            alertInfo="Downloading the Excel file will reset all product quantities in this voyage to zero and move it to Completed Voyages."
            handleClose={() => setShowExportConfirm(false)}
            handleSubmit={confirmExport}
          />
        </div>
      )}
    </div>
  );
};

export default VoyageByCompany;