import React from "react";
import SearchableDropdown from "./SearchableDropdown ";
import { useVoyageStore } from "../store/useVoyageStore";
import { useAuthStore } from "../store/useAuthStore";
import { useState } from "react";
import { useEffect } from "react";
import { PlaneTakeoff } from "lucide-react";

const PackageByCompany = () => {
  const { authUser } = useAuthStore();
  const { getAllVoyagesByBranch, allVoyagesByBranch, isVoyagesLoading } =
    useVoyageStore();

  const [selectedVoyage, setSelectedVoyage] = useState("");

  useEffect(() => {
    getAllVoyagesByBranch(authUser.branchId);
  }, []);

  const VoyageOptions = allVoyagesByBranch.map((voyage) => ({
    id: voyage.id,
    name: voyage.voyageName,
  }));

  const handleSelectVoyage = (voyage) => {
    setSelectedVoyage(voyage);
  };

  return (
    <div>
      <div className="bg-white p-3 shadow-sm rounded hover:shadow-gray-400">
        <SearchableDropdown
          label="Voyage Number"
          placeholder="Select Voyage"
          options={VoyageOptions}
          onSelect={handleSelectVoyage}
          value={selectedVoyage}
          LabelIcon={PlaneTakeoff}
        />
      </div>
      <div></div>
    </div>
  );
};

export default PackageByCompany;
