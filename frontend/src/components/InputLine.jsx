import React from 'react';

const InputLine = ({ label, name, value, onChange, placeholder, type = "text" }) => {
  return (
    <div className="w-full flex flex-col">
      <label className="text-gray-400 text-[12px]">{label}</label>
      <input 
        type={type} 
        name={name}  
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        className="w-full focus:outline-none px-4 py-2 border-b border-gray-500 focus:border-black focus:border-b-2"
      />
    </div>
  );
};

export default InputLine;
