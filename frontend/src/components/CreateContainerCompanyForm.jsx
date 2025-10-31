import React from "react";
import InputLine from "./InputLine";
import SolidButton from "./SolidButton";
import { useAuthStore } from "../store/useAuthStore";
import { useState } from "react";

const CreateContainerCompanyForm = ({
  isCreating,
  onCreateContainerCompany,
  setShowCreateContainerCompany,
  lineId,
}) => {
  const { authUser } = useAuthStore();

  const [containerCompanyData, setContainerCompanyData] = useState({
    containerCompanyName: "",
    branchId: authUser.branchId,
    lineId: lineId,
  });

  const handleChange = (e) => {
    setContainerCompanyData({
      ...containerCompanyData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await onCreateContainerCompany(containerCompanyData);
      setShowCreateContainerCompany(false);
    } catch (error) {}
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-96 relative">
        <h1 className="text-center font-medium text-base mb-3.5">
          ENTER CONTAINER-COMPANY DETAILS
        </h1>

        <div className="h-0.5 bg-gray-700 mb-6" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <InputLine
            label="Enter Container-company Name"
            placeholder="Enter Container-company Name"
            onChange={handleChange}
            value={containerCompanyData.containerCompanyName}
            name="containerCompanyName"
          />

          <div className="flex gap-4 justify-center mt-4">
            <SolidButton
              buttonName="Cancel"
              variant="outlined"
              onClick={() => setShowCreateContainerCompany(false)}
              disabled={isCreating}
            />
            <SolidButton
              buttonName="Save"
              type="submit"
              disabled={isCreating}
              isLoading={isCreating}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContainerCompanyForm;
