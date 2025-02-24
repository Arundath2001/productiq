import React from "react";
import { useLocation, useParams } from "react-router-dom";
import BillofLading from "../pages/BillofLading";
import Voyages from "../pages/Voyages";
import CompletedVoyages from "../pages/CompletedVoyages";
import AllProductQr from "../pages/AllProductQr";
import EmployeeList from "../pages/EmployeeList";
import ClientInfo from "../pages/ClientInfo";
import VoyageDetails from "../pages/VoyageDetails";
import AllCodeDetails from "../pages/AllCodeDetails";

const MainContent = () => {
  const location = useLocation();
  const params = useParams();

  const path = location.pathname;

  const renderContent = () => {
    if (path.startsWith("/voyage/")) {
      return <VoyageDetails voyageId={params.voyageId} />;
    }
    if (path.startsWith("/voyages/getproducts/")) {
      return <AllCodeDetails productCode={params.productCode} />;
    }

    switch (path) {
      case "/bill":
        return <BillofLading />;
      case "/":
      case "/Voyages":
        return <Voyages />;
      case "/completed":
        return <CompletedVoyages />;
      case "/productqr":
        return <AllProductQr />;
      case "/employee":
        return <EmployeeList />;
      case "/client":
        return <ClientInfo />;
      default:
        return <Voyages />;
    }
  };

  return <div>{renderContent()}</div>;
};

export default MainContent;
