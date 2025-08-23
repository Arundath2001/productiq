import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import InputLine from "./InputLine";
import SearchableDropdown from "./SearchableDropdown ";
import SolidButton from "./SolidButton";
import Tooltip from "./Tooltip";
import { useCompanyStore } from "../store/useCompanyStore";
import { useGoni } from "../store/useGoniStore";

const CreatePackageForm = ({ setShowCreateForm }) => {
  const { companies, getAllCompanies } = useCompanyStore();
  const { createGoni, isLoading } = useGoni();
  // const { selectedCompany, setSelectedCompany } = useCompanyStore();

  const [packageName, setPackageName] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");

  useEffect(() => {
    getAllCompanies();
  }, []);

  const companyOptions = companies.map((company) => ({
    id: company.id,
    name: company.companyCode,
  }));

  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
  };

  const handleCreate = async () => {
    try {
      await createGoni({
        goniName: packageName,
        companyId: selectedCompany.id,
      });

      setShowCreateForm(false);
      setPackageName("");
      setSelectedCompany(null);
    } catch (error) {
      console.error("Failed to create package:", error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-center flex-1">
          Create New Package
        </h3>
        <Tooltip text="Close Form" position="right">
          <button
            onClick={() => setShowCreateForm(false)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X size={20} />
          </button>
        </Tooltip>
      </div>

      <div className="border-b mb-4" />

      <div className="flex flex-col gap-2 mb-4">
        <InputLine
          label="Package Name"
          placeholder="Enter Package Name"
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
        />
        <SearchableDropdown
          label="Company Code"
          placeholder="Select Company Code"
          options={companyOptions}
          onSelect={handleSelectCompany}
          value={selectedCompany}
        />
      </div>

      <div className="flex gap-2.5 justify-center">
        <SolidButton
          buttonName="Cancel"
          variant=""
          onClick={() => setShowCreateForm(false)}
        />
        <SolidButton buttonName="Create" onClick={handleCreate} />
      </div>
    </div>
  );
};

export default CreatePackageForm;
