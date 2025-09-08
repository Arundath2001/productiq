import React, { useEffect, useState } from "react";
import SearchableDropdown from "./SearchableDropdown ";
import { useCompanyStore } from "../store/useCompanyStore";
import { useVoyageStore } from "../store/useVoyageStore";
import { useAuthStore } from "../store/useAuthStore";
import { usePackage } from "../store/usePackageStore";
import {
  Building,
  Building2,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader,
  PlaneTakeoff,
} from "lucide-react";
import Tooltip from "./Tooltip";
import { useNavigate } from "react-router-dom";
import {
  exportPackagesToExcel,
  exportPackagesToSingleSheet,
} from "../lib/excelPackage";

const PackageDetails = () => {
  const navigate = useNavigate();

  const { companies, getAllCompanies } = useCompanyStore();
  const { getAllVoyagesByBranch, allVoyagesByBranch, isVoyagesLoading } =
    useVoyageStore();
  const { authUser } = useAuthStore();
  const { packageDetailsByVoyageAndCompany, isLoadingPackages, packages } =
    usePackage();

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedVoyage, setSelectedVoyage] = useState("");

  useEffect(() => {
    getAllCompanies();
    getAllVoyagesByBranch(authUser.branchId);
  }, []);

  useEffect(() => {
    if (selectedCompany && selectedVoyage) {
      packageDetailsByVoyageAndCompany(selectedCompany.id, selectedVoyage.id);
    }
  }, [selectedCompany, selectedVoyage, packageDetailsByVoyageAndCompany]);

  const companyOptions = companies.map((company) => ({
    id: company.id,
    name: company.companyCode,
  }));

  const VoyageOptions = allVoyagesByBranch.map((voyage) => ({
    id: voyage.id,
    name: voyage.voyageName,
  }));

  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
  };

  const handleSelectVoyage = (voyage) => {
    setSelectedVoyage(voyage);
  };

  const handleNavigate = (packageId) => {
    navigate(`/dashboard/packages/${packageId}/package-details`);
  };

  const handleExportToExcel = async () => {
    if (!packages || packages.length === 0) {
      alert(
        "No packages data to export. Please select company and voyage first."
      );
      return;
    }

    try {
      const companyName = selectedCompany?.name || "";
      const voyageName = selectedVoyage?.name || "";

      await exportPackagesToExcel(packages, companyName, voyageName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error occurred while exporting to Excel. Please try again.");
    }
  };

  return (
    <div>
      <div className="flex gap-2.5 bg-white p-5 shadow-sm items-center">
        <div className="flex-1">
          <SearchableDropdown
            label="Client Company"
            placeholder="Select client"
            options={companyOptions}
            onSelect={handleSelectCompany}
            value={selectedCompany}
            LabelIcon={Building2}
          />
        </div>

        <div className="flex-1">
          <SearchableDropdown
            label="Voyage Number"
            placeholder="Select Voyage"
            options={VoyageOptions}
            onSelect={handleSelectVoyage}
            value={selectedVoyage}
            LabelIcon={PlaneTakeoff}
          />
        </div>

        <Tooltip text="Export packages to Excel">
          <button
            onClick={handleExportToExcel}
            disabled={!packages || packages.length === 0}
            className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg px-2 py-4 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:from-green-600 hover:to-emerald-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet size={20} />
            <span>Export Excel</span>
            <Download size={20} />
          </button>
        </Tooltip>
      </div>

      {isLoadingPackages && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-2">
            <Loader className="size-8 animate-spin text-blue-500" />
            <p className="text-gray-600">Loading packages...</p>
          </div>
        </div>
      )}

      {packages && packages.length > 0 && !isLoadingPackages && (
        <div className="mt-2.5">
          <h3 className="text-lg font-semibold mb-3">Package Details</h3>
          <div className="space-y-2">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className="p-3 rounded bg-white shadow-sm flex justify-between items-center"
              >
                <div>
                  <p className="text-lg">
                    Package Name : {pkg.goniId.goniName}
                  </p>
                  <p className="text-lg">Goni Number : {pkg.goniNumber}</p>
                </div>
                <div>
                  <Tooltip text="Package Details">
                    <ChevronRight
                      className="cursor-pointer"
                      onClick={() => handleNavigate(pkg._id)}
                    />
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {packages &&
        packages.length === 0 &&
        selectedCompany &&
        selectedVoyage &&
        !isLoadingPackages && (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-600 text-lg">
              No packages found for the selected company and voyage.
            </p>
          </div>
        )}
    </div>
  );
};

export default PackageDetails;
