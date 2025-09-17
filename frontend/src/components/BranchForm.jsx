import { Plus, X } from "lucide-react";
import React, { useState } from "react";
import InputLine from "./InputLine";
import SearchableDropdown from "./SearchableDropdown ";
import { countries } from "../lib/countries.js";
import PasswordField from "./PasswordField.jsx";
import CheckDropdown from "./CheckDropdown.jsx";
import Tooltip from "./Tooltip.jsx";
import SquareButton from "./SquareButton.jsx";

const BranchForm = ({ setShowCreateBranch }) => {
  const [showAdministrators, setShowAdministrators] = useState(false);
  const [administrators, setAdministrators] = useState([]);

  const handleShowAdministrators = () => {
    setShowAdministrators(true);

    setAdministrators([{ id: Date.now() }]);
  };

  const handleRemoveAdministrator = (id) => {
    setAdministrators(administrators.filter((admin) => admin.id !== id));

    if (administrators.length === 1) {
      setShowAdministrators(false);
    }
  };

  const handleAddAdministrator = () => {
    setAdministrators([...administrators, { id: Date.now() }]);
  };

  const handleCloseForm = () => {
    setShowCreateBranch(false);
  };

  return (
    <div className="flex flex-col p-6 bg-white rounded-lg shadow-lg max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-center flex-1">Create New Branch</h3>
        <Tooltip text="close">
          <button
            onClick={() => handleCloseForm()}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X size={20} />
          </button>
        </Tooltip>
      </div>

      <div className="border-b mb-4" />

      <div className="flex gap-3.5 items-center">
        <InputLine label="Branch Name" placeholder="Branch Name" />
        <SearchableDropdown
          label="Country"
          placeholder="Select a country"
          options={countries}
          onSelect={(value) => console.log("Selected:", value)}
        />
      </div>

      {!showAdministrators && (
        <div className="mt-3.5">
          <div
            className="border flex p-2.5 gap-2.5 cursor-pointer w-fit"
            onClick={handleShowAdministrators}
          >
            <Plus />
            <p>Branch Administrators</p>
          </div>
        </div>
      )}

      {showAdministrators && (
        <div className="mt-2.5">
          <h3>Branch Administrators</h3>

          <div className="">
            {administrators.map((admin) => (
              <div key={admin.id} className="bg-gray-100 rounded-lg p-2.5 mt-2">
                <div className="flex justify-end">
                  <button
                    onClick={() => handleRemoveAdministrator(admin.id)}
                    className="text-gray-500 hover:text-gray-700 cursor-pointer p-1"
                    title="close"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex gap-2.5 mb-1.5">
                  <CheckDropdown label="Role" placeholder="Select Roles" />
                  <InputLine
                    label="Admin Name"
                    placeholder="Enter Admin Name"
                  />
                  <PasswordField placeholder="Enter the Password" />
                </div>
              </div>
            ))}
            <div className="flex justify-center mt-3">
              <button
                className="text-blue-400 flex items-center gap-2.5 cursor-pointer"
                type="button"
                onClick={handleAddAdministrator}
              >
                <Plus size={20} />
                <span className="text-sm">Add New Administartor</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex mt-10 gap-2.5 justify-end">
        <SquareButton
          onClick={() => setShowCreateBranch(false)}
          buttonName="Cancel"
          variant="cancel"
        />
        <SquareButton buttonName="Save" />
      </div>
    </div>
  );
};

export default BranchForm;
