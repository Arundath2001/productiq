import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { usePackage } from "../store/usePackageStore";
import PageHeader from "../components/PageHeader";
import { Loader } from "lucide-react";

const PackageProducts = () => {
  const { packageId } = useParams();

  const { getPackageDetails, isLoadingPackages, pkgError, packageDetails } =
    usePackage();

  useEffect(() => {
    if (packageId) {
      getPackageDetails(packageId);
    }
  }, [packageId, getPackageDetails]);

  if (isLoadingPackages) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        mainHead={`${
          packageDetails?.goniId?.goniName || "Unknown Package"
        } - Products`}
        subText={`${packageDetails?.products?.length || 0} Products`}
      />
      <div className="mt-10">
        {packageDetails && packageDetails?.products?.length > 0 ? (
          <div className="">
            {packageDetails?.products?.map((product, index) => (
              <div
                key={product._id}
                className="bg-white mb-2.5 p-3.5 rounded-lg shadow-sm"
              >
                <p className="text-lg">Product Code : {product.productCode}</p>
                <p className="text-lg">Qty No : {product.sequenceNumber}</p>
              </div>
            ))}
          </div>
        ) : (
          <div>bye</div>
        )}
      </div>
    </div>
  );
};

export default PackageProducts;
