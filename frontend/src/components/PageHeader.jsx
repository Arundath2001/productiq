import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NormalButton from "./NormalButton";
import { FaFilter } from "react-icons/fa";
import SearchFields from "./SearchFields";

const PageHeader = ({ mainHead, subText, onCreate, onExport, searchQuery, setSearchQuery, showDateFilter, startDate, setStartDate, endDate, setEndDate, weight = false, placeholder }) => {
  const [showFilters, setShowFilters] = useState(false);

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-black font-medium text-base px-1.5">{mainHead}</h1>
          <p className="text-xs text-blue-400">{subText}</p>
          {weight && (
            <>
            <h1 className="text-black font-medium text-base px-1.5">Total Weight</h1>
            <p className="text-xs text-blue-400">{weight} kg</p>
            </>
          )}
        </div>

        <div className="flex gap-2.5">
          <NormalButton icon={FaFilter} onClick={toggleFilters} />
          {onCreate && (
            <NormalButton buttonName="Create Voyage" onClick={onCreate} />
          )}
          {onExport && (
            <NormalButton buttonName="Export As Excel" onClick={onExport} />
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            key="search-fields"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mt-2 overflow-hidden"
          >
            <SearchFields
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showDateFilter={showDateFilter}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              placeholder={placeholder}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PageHeader;
