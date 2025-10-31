import React from "react";
import InputLine from "./InputLine";
import SolidButton from "./SolidButton";
import { useAuthStore } from "../store/useAuthStore";
import { useState } from "react";

const CreateLineForm = ({ isCreating, onCreateLine, setShowCreateLine }) => {
  const { authUser } = useAuthStore();

  const [lineData, setLineData] = useState({
    lineName: "",
    branchId: authUser.branchId,
  });

  const handleChange = (e) => {
    setLineData({ ...lineData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await onCreateLine(lineData);
      setShowCreateLine(false);
    } catch (error) {}
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-96 relative">
        <h1 className="text-center font-medium text-base mb-3.5">
          ENTER LINE DETAILS
        </h1>

        <div className="h-0.5 bg-gray-700 mb-6" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <InputLine
            label="Enter Line Name"
            placeholder="Enter Line Name"
            onChange={handleChange}
            value={lineData.lineName}
            name="lineName"
          />

          <div className="flex gap-4 justify-center mt-4">
            <SolidButton
              buttonName="Cancel"
              variant="outlined"
              onClick={() => setShowCreateLine(false)}
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

export default CreateLineForm;
