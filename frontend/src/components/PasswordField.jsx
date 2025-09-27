import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";

const PasswordField = ({ placeholder, value, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full flex flex-col">
      <label className="text-gray-400 text-[12px]">Password</label>
      <div className="relative">
        <input
          className="w-full outline-none border-b border-gray-500 px-4 py-2 pr-10 focus:border-black focus:border-b-2"
          placeholder={placeholder}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
          title={showPassword ? "Hide Password" : "Show Password"}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
};

export default PasswordField;
