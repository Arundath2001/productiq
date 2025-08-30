import React from "react";

const SolidButton = ({
  buttonName,
  variant = "solid",
  onClick,
  type = "button",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`w-32 px-6 py-2.5 text-center cursor-pointer border text-base ${
        variant === "solid"
          ? "bg-black text-white border-black hover:bg-gray-900"
          : "bg-white text-black border-black hover:bg-gray-200"
      }`}
    >
      {buttonName}
    </button>
  );
};

export default SolidButton;
