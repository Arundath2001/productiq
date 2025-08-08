import React, { useState } from "react";

const ConfirmAlert = ({
  alertInfo,
  handleClose,
  handleSubmit,
  showDateInput = false,
  dateLabel = "Destination arrival date",
  datePlaceholder = "Select arrival date",
  onDateChange = null,
}) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [error, setError] = useState("");

  const handleDateInputChange = (e) => {
    const value = e.target.value;
    const dateObj = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateObj < today) {
      setError("Please select a future date");
    } else {
      setError("");
    }

    setSelectedDate(value);
    if (onDateChange) {
      onDateChange(value);
    }
  };

  const handleSubmitClick = () => {
    if (showDateInput) {
      if (!selectedDate) {
        setError("Please select a date");
        return;
      }

      const dateObj = new Date(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateObj < today) {
        setError("Please select a future date");
        return;
      }

      handleSubmit(dateObj);
    } else {
      handleSubmit();
    }
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <div className="w-96 bg-white p-7 rounded-xl">
      <h1 className="text-base text-center font-semibold mb-4 text-red-700">
        Are You Sure?
      </h1>
      <div className="h-0.5 bg-black mb-1.5" />
      <p className="text-center mb-4 text-xs">{alertInfo}</p>

      {showDateInput && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
            {dateLabel}
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateInputChange}
            placeholder={datePlaceholder}
            min={getTodayString()}
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
