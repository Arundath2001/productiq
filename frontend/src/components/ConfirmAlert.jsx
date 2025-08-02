import React, { useState } from "react";

const ConfirmAlert = ({
  alertInfo,
  handleClose,
  handleSubmit,
  showDaysInput = false,
  daysLabel = "Days to reach destination",
  daysPlaceholder = "Enter number of days",
  onDaysChange = null,
}) => {
  const [days, setDays] = useState("");
  const [error, setError] = useState("");

  const handleDaysInputChange = (e) => {
    const value = e.target.value;

    // Allow only positive numbers
    if (value === "" || (Number(value) > 0 && !isNaN(value))) {
      setDays(value);
      setError("");
      if (onDaysChange) {
        onDaysChange(value);
      }
    }
  };

  const handleSubmitClick = () => {
    if (showDaysInput) {
      if (!days || days <= 0) {
        setError("Please enter a valid number of days");
        return;
      }
      // Pass the days value to the submit handler
      handleSubmit(Number(days));
    } else {
      handleSubmit();
    }
  };

  return (
    <div className="w-96 bg-white p-7 rounded-xl">
      <h1 className="text-base text-center font-semibold mb-4 text-red-700">
        Are You Sure?
      </h1>
      <div className="h-0.5 bg-black mb-1.5" />
      <p className="text-center mb-4 text-xs">{alertInfo}</p>

      {showDaysInput && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
            {daysLabel}
          </label>
          <input
            type="number"
            value={days}
            onChange={handleDaysInputChange}
            placeholder={daysPlaceholder}
            min="1"
            className={`w-full px-3 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          />
          {error && (
            <p className="text-red-500 text-xs text-center mt-1">{error}</p>
          )}
        </div>
      )}

      <div className="flex justify-center gap-7">
        <div
          onClick={handleClose}
          className="w-20 text-white bg-red-500 px-3.5 py-2 rounded-xl text-center cursor-pointer hover:bg-red-600 transition-colors"
        >
          No
        </div>
        <div
          onClick={handleSubmitClick}
          className="w-20 text-white bg-green-500 px-3.5 py-2 rounded-xl text-center cursor-pointer hover:bg-green-600 transition-colors"
        >
          Yes
        </div>
      </div>
    </div>
  );
};

export default ConfirmAlert;
