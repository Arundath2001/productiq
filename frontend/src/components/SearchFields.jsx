import React from "react";
import { FaCalendar, FaSearch } from "react-icons/fa";

const SearchFields = ({ searchQuery, setSearchQuery, showDateFilter = true, startDate, setStartDate, endDate, setEndDate }) => {

  const handleClear = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
  }

  return (
    <div className="mt-5">
      <form className="bg-white px-3.5 py-5 rounded-xl flex justify-between">
        <div className="flex gap-2.5 w-full">
          {showDateFilter && (
            <>
              <div className="flex items-center gap-2 border-b-2 border-gray-400 px-2.5 py-1.5 focus-within:border-black w-1/3">
                <FaCalendar color="gray" />
                <input
                  type="date"
                  className="flex-1 outline-none"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 border-b-2 border-gray-400 px-2.5 py-1.5 focus-within:border-black w-1/3">
                <FaCalendar color="gray" />
                <input
                  type="date"
                  className="flex-1 outline-none"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-2 border-b-2 border-gray-400 px-2.5 py-1.5 focus-within:border-black w-full">
            <FaSearch color="gray" />
            <input
              className="flex-1 outline-none"
              placeholder="Search by voyage name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div onClick={handleClear} className="px-2.5 py-2 text-base border border-black rounded-xl cursor-pointer ml-2">
          Clear
        </div>
      </form>
    </div>
  );
};

export default SearchFields;
