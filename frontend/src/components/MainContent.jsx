import React from "react";
import BillofLading from "../pages/BillofLading";
import Voyages from "../pages/Voyages";
import CompletedVoyages from "../pages/CompletedVoyages";
import AllProductQr from "../pages/AllProductQr";
import EmployeeList from "../pages/EmployeeList";
import ClientInfo from "../pages/ClientInfo";
import VoyageDetails from "../pages/VoyageDetails";
import AllCodeDetails from "../pages/AllCodeDetails";

const MainContent = ({ selectedTab }) => {
  const renderContent = () => {
    switch (selectedTab) {
      case "bill":
        return <BillofLading />;
      case "Voyages":
        return <Voyages />;
      case "completed":
        return <CompletedVoyages />;
      case "productqr":
        return <AllProductQr />;
      case "employee":
        return <EmployeeList />;
      case "client":
        return <ClientInfo />;
      case "VoyageDetails":
        return <VoyageDetails />;
      case "AllCodeDetails":
        return <AllCodeDetails />
      default:
        return <Voyages />;
    }
  };

  return <div>{renderContent()}</div>;
};

export default MainContent;
