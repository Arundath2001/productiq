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
import VoyageByCompany from "../pages/VoyageByCompany";
import CompletedVoyageByCompany from "../pages/CompletedVoyageByCompany";
import CompletedVoyageDetails from "../pages/CompletedVoyageDetails";
import CustomerCodeCreation from "../pages/CustomerCodeCreation";
import TrackProduct from "../pages/TrackProduct";

const MainContent = () => {
  const location = useLocation();
  const { voyageId, companyCode, productCode } = useParams();
  const path = location.pathname;

  const renderContent = () => {
    // Handle /completed-voyage/:voyageId/companies/:companyCode
    if (path.match(/^\/completed-voyage\/[^\/]+\/companies\/[^\/]+$/)) {
      return (
        <CompletedVoyageDetails voyageId={voyageId} companyCode={companyCode} />
      );
    }

    // Handle /completed-voyage/:voyageId/companies
    if (path.match(/^\/completed-voyage\/[^\/]+\/companies$/)) {
      return <CompletedVoyageByCompany voyageId={voyageId} />;
    }

    // Handle /voyage/:voyageId/companies/:companyCode
    if (path.match(/^\/voyage\/[^\/]+\/companies\/[^\/]+$/)) {
      return <VoyageDetails voyageId={voyageId} companyCode={companyCode} />;
    }

    // Handle /voyage/:voyageId/companies
    if (path.match(/^\/voyage\/[^\/]+\/companies$/)) {
      return <VoyageByCompany voyageId={voyageId} />;
    }

    // Handle /voyages/getproducts/:productCode
    if (path.match(/^\/voyages\/getproducts\/[^\/]+$/)) {
      return <AllCodeDetails productCode={productCode} />;
    }

    // Handle static routes
    switch (path) {
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
      case "/allBills":
      case "/allbills": // Handle both cases
        return <AllBills />;
      case "/sendNotification":
        return <SendNotification />;
      case "/customercode":
        return <CustomerCodeCreation />;
      case "/trackproduct":
        return <TrackProduct />;
      default:
        return <Voyages />;
    }
  };

  return <div>{renderContent()}</div>;
};

export default MainContent;
