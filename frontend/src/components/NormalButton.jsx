import React from "react";

const NormalButton = ({ buttonName, icon: Icon, onClick, className }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-2.5 bg-black text-white rounded-lg text-xs border border-transparent cursor-pointer ${
        className || ""
      }`}
    >
      {Icon && <Icon />}
      {buttonName && buttonName}
    </div>
  );
};

export default NormalButton;
