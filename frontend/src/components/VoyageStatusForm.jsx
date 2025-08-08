import React, { useState } from "react";
import SolidButton from "./SolidButton";

const VoyageStatusForm = ({
  voyageName,
  onClose,
  onUpdate,
  expectedDate,
  delayMessage,
}) => {
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const [expectedArrivalDate, setExpectedArrivalDate] = useState(
    formatDateForInput(expectedDate)
  );
  const [newDelayMessage, setNewDelayMessage] = useState(delayMessage || "");

  const handleUpdate = () => {
    const updateData = {
      expectedDate: expectedArrivalDate,
      delayMessage: newDelayMessage,
    };
    onUpdate(updateData);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-96 border border-gray-100">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-1">
          Update {voyageName} Status
        </h3>
        {/* <p className="text-sm text-gray-500">{voyageName}</p> */}
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Expected Arrival Date
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 
                     focus:outline-none focus:ring-2 focus:ring-black-500
                     transition-colors duration-200 bg-gray-50 hover:bg-white"
            type="date"
            value={formatDateForInput(expectedArrivalDate)}
            onChange={(e) => setExpectedArrivalDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Delay Message
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 
                     focus:outline-none focus:ring-2 focus:ring-black-500  
                     transition-colors duration-200 bg-gray-50 hover:bg-white resize-none"
            rows="3"
            placeholder="Enter reason for delay (optional)"
            value={newDelayMessage}
            onChange={(e) => setNewDelayMessage(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-8 flex gap-3 justify-center">
        <SolidButton onClick={onClose} variant="" buttonName="Cancel" />
        <SolidButton
          onClick={handleUpdate}
          buttonName="Update"
          variant="solid"
        />
      </div>
    </div>
  );
};

export default VoyageStatusForm;
