import React from "react";
import { useState } from "react";
import { useTrackProduct } from "../store/useTrackProductStore.js";
import {
  Image,
  Loader,
  Package,
  Search,
  X,
  ArrowUp,
  ArrowDown,
  XCircle,
} from "lucide-react";

const TrackProduct = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const {
    productDetails,
    isLoading,
    error,
    trackProduct,
    resetTracking,
    clearProductDetails,
  } = useTrackProduct();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    try {
      await trackProduct(trackingNumber);
    } catch (error) {}
  };

  const handleClearInput = () => {
    setTrackingNumber("");
    clearProductDetails();
  };

  const openImageModal = () => {
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: true,
      timeZone: "Asia/Dubai",
    });
  };

  return (
    <div>
      <div className="mb-6">
        <p className="text-2xl font-semibold mb-6">Track Product</p>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="flex items-stretch gap-4">
            <div className="flex flex-1 items-center gap-4 rounded-lg shadow-sm border border-gray-400 p-4">
              <Search className="text-gray-400 h-5 w-5" />
              <input
                className="w-full outline-none"
                type="text"
                placeholder="Enter Tracking Number (e.g., AWF123456789)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                disabled={isLoading}
              />
              {trackingNumber && (
                <button
                  type="button"
                  onClick={handleClearInput}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <XCircle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <button
              className="px-8 py-3 text-sm bg-black text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              Track Product
            </button>
          </form>
        </div>
      </div>

      {isLoading && (
        <div className="bg-white p-8 rounded-lg text-center shadow-sm">
          <Loader className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-xl text-gray-600 mb-2">Tracking Product...</p>
          <p className="text-gray-500">
            Please wait while we fetch your shipment details
          </p>
        </div>
      )}

      {!isLoading && !productDetails && trackingNumber === "" && (
        <div className="bg-white p-8 rounded-lg text-center shadow-sm">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 mb-2">Track Your Product</p>
          <p className="text-gray-500">
            Enter a tracking number above to get detailed information about your
            shipment
          </p>
        </div>
      )}

      {!isLoading && !productDetails && trackingNumber !== "" && !error && (
        <div className="bg-white p-8 rounded-lg text-center shadow-sm">
          <Search className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <p className="text-xl text-blue-600 mb-2">Ready to Track</p>
          <p className="text-gray-500 mb-4">
            Press{" "}
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
              Enter
            </kbd>{" "}
            or click "Track Product" to search for "{trackingNumber}"
          </p>
        </div>
      )}

      {!isLoading && !productDetails && trackingNumber !== "" && error && (
        <div className="bg-white p-8 rounded-lg text-center shadow-sm">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <p className="text-xl text-red-600 mb-2">Product Not Found</p>
          <p className="text-gray-500 mb-4">
            We couldn't find any product with tracking number "{trackingNumber}
            ". Please check the number and try again.
          </p>
          <button
            onClick={handleClearInput}
            className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Track New Item
          </button>
        </div>
      )}

      {productDetails && (
        <div
          className={`bg-white p-6 rounded-xl shadow-sm border-l-4  ${
            productDetails.status === "completed"
              ? "border-green-400"
              : "border-orange-400"
          }`}
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-sm text-gray-500 mb-1">Product Code</p>
              <p className="text-4xl font-bold text-blue-600">
                {productDetails.productCode}
              </p>
            </div>
            <button
              onClick={openImageModal}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <Image className="h-5 w-5" />
              <span className="text-sm font-medium">View Image</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-8 mb-8">
            <div className="bg-gray-100 p-2">
              <p className="text-sm text-gray-500 mb-2">Quantity</p>
              <p className="text-xl font-semibold text-gray-900">
                {productDetails.sequenceNumber}
              </p>
            </div>
            <div className="bg-gray-100 p-2">
              <p className="text-sm text-gray-500 mb-2">Weight</p>
              <p className="text-xl font-semibold text-gray-900">
                {productDetails.weight}
              </p>
            </div>
            <div className="bg-gray-100 p-2">
              <p className="text-sm text-gray-500 mb-2">Voyage</p>
              <p className="text-xl font-semibold text-gray-900">
                {productDetails.voyageNumber}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mb-8">
            <div className="bg-gray-100 p-2">
              <p className="text-sm text-gray-500 mb-2">Company</p>
              <p className="text-xl font-semibold text-gray-900">
                {productDetails.clientCompany}
              </p>
            </div>
            <div className="bg-gray-100 p-2">
              <p className="text-sm text-gray-500 mb-2">Uploaded By</p>
              <p className="text-xl font-semibold text-gray-900">
                {productDetails.uploadedBy.username}
              </p>
            </div>
            <div className="bg-gray-100 p-2">
              <p className="text-sm text-gray-500 mb-2">Status</p>
              <p className="text-xl font-semibold text-gray-900">
                {productDetails.status === "completed"
                  ? "Exported"
                  : "Received"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <ArrowDown className="text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Received Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(productDetails.uploadedDate)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <ArrowUp className="text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Exported Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(productDetails.exportedDate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImageModal && productDetails && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
        >
          <div className="relative bg-white rounded-lg max-w-4xl max-h-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                Product Image - {productDetails.productCode}
              </h3>
              <button
                onClick={closeImageModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4">
              <img
                src={productDetails.image}
                alt={`Product ${productDetails.productCode}`}
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackProduct;
