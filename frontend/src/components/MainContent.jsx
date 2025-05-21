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
import AllBills from "../pages/AllBills";
import SendNotification from "../pages/SendNotification";

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
      case "/":
        return <Voyages />;
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
      case "/allBills":
        return <AllBills />;
      case "/sendNotification":
        return <SendNotification />;
      default:
        return <Voyages />;
    }
  };

  return <div>{renderContent()}</div>;
};

export default MainContent;
