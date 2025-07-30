import React from "react";
import { Hammer } from "lucide-react";

const Shipment = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center">
      <Hammer className="w-12 h-12 text-yellow-500 mb-4" />
      <h1 className="text-2xl font-semibold text-gray-800">
        Page Under Development
      </h1>
      <p className="text-gray-600 mt-2">
        We’re working on the page. Please check back soon!
      </p>
    </div>
  );
};

export default Shipment;
