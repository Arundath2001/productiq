import { ChevronDown, XCircleIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const SearchableDropdown = ({ label, placeholder, options = [], onSelect }) => {
  const [dropOpen, setDropOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const dropdownRef = useRef(null);

  const filteredItems = options.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setDropOpen(false);
    setSearchTerm("");
    if (onSelect) onSelect(item);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  return (
    <div className="w-full flex flex-col" ref={dropdownRef}>
      <label className="text-[12px] text-gray-400">{label}</label>
      <div className="relative">
        <div
          onClick={() => setDropOpen(!dropOpen)}
          className={`flex px-4 py-2 items-center justify-between border-b ${
            dropOpen ? "border-black border-b-2" : "border-b-gray-500"
          } cursor-pointer`}
        >
          <span className={`${selectedItem ? "text-black" : "text-gray-400"}`}>
            {selectedItem.name || placeholder}
          </span>
          <ChevronDown
            className={`transition-transform ${dropOpen ? "rotate-180" : ""}`}
            size={16}
          />
        </div>

        {dropOpen && (
          <div className="absolute w-full bg-white max-h-60 z-20 mt-1 rounded-lg border border-gray-400 shadow-lg overflow-hidden">
            <div className="flex items-center p-2 border-b border-gray-200">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search"
                className="w-full outline-none px-2 text-sm"
                autoFocus
              />
              {searchTerm && (
                <XCircleIcon
                  size={16}
                  className="cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={() => setSearchTerm("")}
                />
              )}
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <div
                    onClick={() => handleSelectItem(item)}
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {item.name}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-400 text-center">
                  No results found!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableDropdown;
