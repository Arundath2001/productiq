import React, { useState } from "react";
import InputLine from "../components/InputLine";
import SolidButton from "./SolidButton";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore.js";
import { Loader } from "lucide-react";

const CreateVoyage = ({ setShowCreateVoyage, onCreateVoyage, isCreating }) => {
  const { authUser } = useAuthStore();

  const [voyageData, setVoyageData] = useState({
    voyageName: "",
    voyageNumber: "",
    year: new Date().getFullYear(),
    branchId: authUser.branchId,
  });

  const validateForm = () => {
    if (!voyageData.voyageName.trim())
      return toast.error("Voyage name is required");
    if (!voyageData.voyageNumber.trim())
      return toast.error("Voyage number is required");
    if (!voyageData.year.toString().trim())
      return toast.error("Voyage year is required");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = validateForm();

    if (success === true) {
      try {
        await onCreateVoyage(voyageData);
        setShowCreateVoyage(false);
      } catch (error) {}
    }
  };

  const handleChange = (e) => {
    setVoyageData({ ...voyageData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white py-5 px-2.5">
      <h1 className="text-center font-medium text-base mb-3.5">
        ENTER VOYAGE DETAILS
      </h1>
      <div className="h-0.5 bg-gray-700 mb-6" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <InputLine
          label="Enter Voyage Name"
          placeholder="Voyage Name"
          name="voyageName"
          value={voyageData.voyageName}
          onChange={handleChange}
        />

        <InputLine
          label="Enter Voyage Number"
          placeholder="Enter Voyage Number"
          name="voyageNumber"
          value={voyageData.voyageNumber}
          onChange={handleChange}
        />

        <InputLine
          label="Year"
          placeholder="Enter the year"
          name="year"
          value={voyageData.year}
          onChange={handleChange}
        />

        <div className="flex gap-4 justify-center mt-6">
          <SolidButton
            buttonName="Cancel"
            variant="outlined"
            onClick={() => setShowCreateVoyage(false)}
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
  );
};

export default CreateVoyage;
