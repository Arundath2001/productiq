import { X } from "lucide-react";
import React from "react";
import Tooltip from "./Tooltip";

const ImagePreview = ({
  onClose,
  selectedImage,
  productCode,
  quantityNumber,
}) => {
  return (
    <div className="bg-white rounded-lg">
      <div className="flex items-center justify-between border-b p-5">
        <div>
          <h3 className="text-lg font-medium">Product Image</h3>
          {(productCode || quantityNumber) && (
            <p className="mt-1 text-sm text-gray-500">
              {productCode && `Product Code : ${productCode}`}
              {quantityNumber && " | "}
              {quantityNumber && `QTY No : ${quantityNumber}`}
            </p>
          )}
        </div>
        <button
          className="cursor-pointer hover:text-gray-600 hover:bg-gray-200 rounded-full p-1"
          onClick={onClose}
        >
          <Tooltip text="close" position="right">
            <X className="h-5 w-5" />
          </Tooltip>
        </button>
      </div>
      <img
        className="max-w-full max-h-[70vh] rounded-lg object-contain p-5"
        src={selectedImage}
        alt="preview image"
      />
    </div>
  );
};

export default ImagePreview;
