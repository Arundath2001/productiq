import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useNavigate, useParams } from "react-router-dom";
import { useVoyageStore } from "../store/useVoyageStore.js";
import { Loader } from "lucide-react";
import images from "../lib/images.js";

const CompletedVoyageDetails = () => {
  const { voyageId, companyCode } = useParams();

  const {
    completedCompanyDetails,
    isCompletedCompanyDetailsLoading,
    getCompletedCompanyDetailsByVoyage,
  } = useVoyageStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (voyageId && companyCode) {
      getCompletedCompanyDetailsByVoyage(voyageId, companyCode).catch(() => {
        setError("Company details not found or no data available.");
      });
    }
  }, [voyageId, companyCode, getCompletedCompanyDetailsByVoyage]);

  if (isCompletedCompanyDetailsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-15 animate-spin" />
      </div>
    );
  }

  if (!completedCompanyDetails) {
    return (
      <div>{error || "Company details not found or no data available."}</div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  const filteredData = completedCompanyDetails.items.filter((data) => {
    const matchesSearch = data.productCode
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const uploadedDate = new Date(data.uploadedDate);
    const isWithinDateRange =
      (!startDate || uploadedDate >= new Date(startDate)) &&
      (!endDate || uploadedDate <= new Date(endDate));

    return matchesSearch && isWithinDateRange;
  });

  return (
    <div>
      <PageHeader
        mainHead={`${completedCompanyDetails.voyageInfo.voyageName || ""} - ${
          completedCompanyDetails.companyCode || "Company"
        } (Completed)`}
        subText={`${filteredData.length} Products`}
        weight={filteredData.length > 0 ? completedCompanyDetails.totalWeight : null}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showDateFilter={true}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        placeholder="Search by productcode"
        showBackButton={true}
        onBack={() => navigate(`/completed-voyage/${voyageId}/companies`)}
      />

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full table-auto border-separate border-spacing-y-2">
          <thead className="bg-white">
            <tr>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                #
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                Product Code
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                QTY No
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                Tracking Number
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                Client Company
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                Weight
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                Sent Date
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600">
                Created By
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((data, index) => (
                <tr
                  key={data._id}
                  className="bg-white rounded-xl overflow-hidden"
                >
                  <td className="py-3 px-5 text-sm text-black">{index + 1}</td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.productCode}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.sequenceNumber}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.trackingNumber}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.clientCompany}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.weight}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {formatDate(data.uploadedDate)}
                  </td>
                  <td className="py-3 px-5 text-sm text-black">
                    {data.uploadedBy.username}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="py-3 px-5 text-sm text-center text-black"
                >
                  <div className="flex flex-col items-center justify-center text-center mt-10">
                    <img
                      src={images.file}
                      alt="No Data"
                      className="w-32 h-32 mb-4 opacity-75"
                    />
                    <p className="text-lg font-semibold text-gray-700">
                      No matching products found!
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompletedVoyageDetails;