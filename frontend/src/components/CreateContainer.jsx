import React, { useState } from "react";
import InputLine from "./InputLine";
import { useAuthStore } from "../store/useAuthStore";
import SolidButton from "./SolidButton";

const CreateContainer = ({
  onCreateContainer,
  setShowCreateContainer,
  isCreating,
  seaVoyageId,
}) => {
  const { authUser } = useAuthStore();

  const [containerData, setContainerData] = useState({
    containerNumber: "",
    seaVoyageId: seaVoyageId,
    branchId: authUser.branchId,
  });

  const handleChange = (e) => {
    setContainerData({ ...containerData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await onCreateContainer(containerData);
      setShowCreateContainer(false);
    } catch (error) {}
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-96 relative">
        <h1 className="text-center font-medium text-base mb-3.5">
          ENTER CONTAINER DETAILS
        </h1>
        <div className="h-0.5 bg-gray-700 mb-6" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <InputLine
            label="Enter Container Number"
            placeholder="Container Number"
            name="containerNumber"
            value={containerData.containerNumber}
            onChange={handleChange}
          />

          <div className="flex gap-4 justify-center mt-4">
            <SolidButton
              buttonName="Cancel"
              variant="outlined"
              onClick={() => setShowCreateContainer(false)}
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

export default CreateContainer;
