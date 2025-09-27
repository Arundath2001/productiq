import { Search, X, XCircle } from "lucide-react";
import React, { useState } from "react";

const NormalSearch = () => {
  const [searchText, setSearchText] = useState("");

  const clearSearchField = () => {
    setSearchText("");
  };

  return (
    <div className="bg-white flex w-96 items-center gap-1 px-3 py-2.5 rounded-lg border border-gray-200 focus-within:border-gray-400">
      <Search className="text-gray-400 h-4 w-4" />
      <input
        type="text"
        placeholder="search"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-full outline-none text-sm"
      />
      {searchText && (
        <button
          onClick={clearSearchField}
          className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default NormalSearch;
