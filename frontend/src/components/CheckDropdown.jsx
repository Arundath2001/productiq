import { Check, ChevronDown, X, XCircle } from "lucide-react";
import React, { useState } from "react";

const CheckDropdown = ({ label, placeholder, onSelectionChange }) => {
  const [dropOpen, setDropOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  const options = ["air_cargo_admin", "ship_cargo_admin"];

  const filteredItems = options.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectItems = (item) => {
    let updatedItems;

    if (selectedItems.includes(item)) {
      updatedItems = selectedItems.filter((selected) => selected !== item);
    } else {
      updatedItems = [...selectedItems, item];
    }
    setSelectedItems(updatedItems);
    if (onSelectionChange) {
      onSelectionChange(updatedItems);
    }
  };

  const removeItems = (e, itemToRemove) => {
    e.stopPropagation();
    const updatedItems = selectedItems.filter((item) => item !== itemToRemove);
    setSelectedItems(updatedItems);
    if (onSelectionChange) {
      onSelectionChange(updatedItems);
    }
  };

  const isItemSelected = (item) => {
    return selectedItems.includes(item);
  };

  return (
    <div className="w-full flex flex-col">
      <label className="text-[12px] text-gray-400">{label}</label>
      <div className="relative">
        <div
          onClick={() => setDropOpen(!dropOpen)}
          className="flex items-center justify-between px-4 py-2 border-b border-b-gray-400 cursor-pointer"
        >
          <div className="flex gap-1">
            {selectedItems.length > 0 ? (
              selectedItems.map((item) => (
                <div key={item}>
                  <span className="flex items-center gap-1 bg-blue-100 text-blue-600 px-1 py-0.5 rounded-md text-sm">
                    {item}
                    <X
                      className="cursor-pointer hover:text-blue-400"
                      size={12}
                      onClick={(e) => removeItems(e, item)}
                    />
                  </span>
                </div>
              ))
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          <ChevronDown
            size={16}
            className={`transition transform ${dropOpen ? "rotate-180" : ""}`}
          />
        </div>
        {dropOpen && (
          <div className="absolute bg-white w-full z-20 mt-1 border border-gray-400 shadow-lg rounded-lg">
            <div className="flex items-center justify-between p-2 border-b border-gray-200">
              <input
                placeholder="Search"
                className="outline-none w-full px-2 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <XCircle
                  className="cursor-pointer text-gray-500 hover:text-gray-700"
                  size={16}
                  onClick={() => setSearchTerm("")}
                />
              )}
            </div>
            <div className="max-h-32 overflow-y-auto">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => {
                  const selected = isItemSelected(item);
                  return (
                    <div
                      key={index}
                      onClick={() => handleSelectItems(item)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <span>{item}</span>
                        {selected && (
                          <div className="w-4 h-4 bg-blue-400 rounded-sm flex items-center justify-center">
                            <Check
                              className="w-3 h-3 text-white"
                              strokeWidth={3}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
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

export default CheckDropdown;
