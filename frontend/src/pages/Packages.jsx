import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import CreatePackages from "../components/CreatePackages";
import { useGoni } from "../store/useGoniStore";
import PackageDetails from "../components/PackageDetails";
import PackageByCompany from "../components/PackageByCompany";

const Packages = () => {
  const [activeTab, setActiveTab] = useState("created");

  const { goniDetails, isLoading, error, getGonies, deleteGoni } = useGoni();

  return (
    <div>
      <PageHeader
        mainHead="Created Packages"
        subText={`${goniDetails.length} Packages`}
      />

      <div className="w-full flex mt-2.5">
        <div className="flex-1">
          <button
            onClick={() => setActiveTab("created")}
            className={`w-full text-center p-2.5 ${
              activeTab === "created"
                ? "bg-blue-300 border-1 border-gray-200 text-lg font-medium text-white"
                : "text-gray-500 cursor-pointer"
            }`}
          >
            Created Packages
          </button>
        </div>
        <div className="flex-1">
          <button
            onClick={() => setActiveTab("details")}
            className={`w-full text-center p-2.5 ${
              activeTab === "details"
                ? "bg-blue-300 border-1 border-gray-200 text-lg font-medium text-white"
                : "text-gray-500 cursor-pointer"
            }`}
          >
            Package Details
          </button>
        </div>
      </div>

      <div className="mt-4">
        {activeTab === "created" && <CreatePackages />}

        {activeTab === "details" && <PackageDetails />}
      </div>
    </div>
  );
};

export default Packages;
