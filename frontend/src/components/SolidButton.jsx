import { Loader } from "lucide-react";
import React from "react";

const SolidButton = ({
  buttonName,
  variant = "solid",
  onClick,
  type = "button",
  disabled,
  isLoading,
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      type={type}
      onClick={onClick}
      className={`w-32 px-6 py-2.5 text-center cursor-pointer border text-base flex items-center justify-center gap-2 ${
        variant === "solid"
          ? "bg-black text-white border-black hover:bg-gray-900"
          : "bg-white text-black border-black hover:bg-gray-200"
      } ${
        disabled || isLoading
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer"
      } `}
    >
      {isLoading && <Loader className="size-4 animate-spin" />}
      {buttonName}
    </button>
  );
};

export default SolidButton;
