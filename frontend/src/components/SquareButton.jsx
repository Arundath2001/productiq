import React from "react";

const SquareButton = ({ onClick, buttonName, variant = "primary" }) => {
  const getButtonStyles = () => {
    switch (variant) {
      case "cancel":
        return `bg-white border-2 text-red-500 border-red-500 hover:bg-red-100`;

      case "primary":
      default:
        return `bg-black text-white border-2 border-black hover:bg-gray-800`;
    }
  };

  return (
    <button
      className={`${getButtonStyles()} outline-noneflex items-center justify-center cursor-pointer font-medium transition-colors duration-200 px-6 py-3 min-w-[100px]`}
      onClick={onClick}
    >
      {buttonName}
    </button>
  );
};

export default SquareButton;
