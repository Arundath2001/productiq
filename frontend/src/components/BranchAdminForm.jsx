import React, { useState } from "react";
import { X } from "lucide-react";
import Tooltip from "./Tooltip";
import InputLine from "./InputLine";
import CheckDropdown from "./CheckDropdown";
import PasswordField from "./PasswordField";
import SquareButton from "./SquareButton";
import { useBranch } from "../store/useBranchStore";

const BranchAdminForm = ({ setShowAdminForm, branchName, branchId }) => {
  const { addBranchAdmin, isLoading, error, getBranchAdmin } = useBranch();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    adminRoles: [],
  });

  const handleCloseAdminForm = () => {
    setShowAdminForm(false);
  };

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleRoleChange = (selectedRoles) => {
    setFormData((prev) => ({
      ...prev,
      adminRoles: selectedRoles,
    }));
  };

  const handleSubmitForm = async () => {
    try {
      await addBranchAdmin(branchName, formData);

      await getBranchAdmin(branchId);

      handleCloseAdminForm();
    } catch (error) {
      console.error("Failed to add admin:", error);
    }
  };

  return (
    <div className="bg-white p-5 rounded max-w-3xl w-full">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg flex-1 text-center">
          Add Branch Admin Form - {branchName}
        </h3>
        <Tooltip text="close">
          <button
            onClick={handleCloseAdminForm}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X size={20} />
          </button>
        </Tooltip>
      </div>
      <div className="flex flex-col gap-2.5">
        <InputLine
          label="Admin Name"
          placeholder="Enter Admin Name"
          value={formData.username}
          onChange={handleInputChange("username")}
        />
        <CheckDropdown
          label="Admin Role"
          placeholder="Select Roles"
          onSelectionChange={handleRoleChange}
        />
        <PasswordField
          placeholder="Enter the Password"
          value={formData.password}
          onChange={handleInputChange("password")}
        />
      </div>
      <div className="flex gap-2.5 justify-end mt-5">
        <SquareButton
          buttonName="Cancel"
          variant="cancel"
          onClick={handleCloseAdminForm}
        />
        <SquareButton
          buttonName={isLoading ? "Creating..." : "Submit"}
          onClick={handleSubmitForm}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default BranchAdminForm;
