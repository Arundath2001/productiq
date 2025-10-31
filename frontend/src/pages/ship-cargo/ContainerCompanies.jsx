import React from "react";
import PageHeader from "../../components/PageHeader";
import { useAuthStore } from "../../store/useAuthStore";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Eye, Loader, Trash2 } from "lucide-react";
import { useState } from "react";
import CreateLineForm from "../../components/CreateLineForm";
import ConfirmAlert from "../../components/ConfirmAlert";
import { useNavigate } from "react-router-dom";
import { useContainerCompanyStore } from "../../store/useContainerCompany";
import CreateContainerCompanyForm from "../../components/CreateContainerCompanyForm";

const ContainerCompanies = () => {
  const {
    containerCompanies,
    containerCompanyLoading,
    containerCompanyError,
    isCreating,
    isDeleting,
    getContainerCompanies,
    createContainerCompany,
    paginationData,
    deleteContainerCompany,
  } = useContainerCompanyStore();

  const { authUser } = useAuthStore();

  const { lineId } = useParams();

  const [showCreateContainerCompany, setShowCreateContainerCompany] =
    useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedContainerCompanyId, setSelectedContainerCompanyId] =
    useState(null);
  const [selectedConatinerCompanyName, setSelectedConatinerCompanyName] =
    useState(null);

  useEffect(() => {
    if (authUser.branchId) {
      getContainerCompanies(authUser.branchId, lineId);
    }
  }, [authUser.branchIdm, lineId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleShowDeleteConfirm = (contnrCmpId, contnrCmpName) => {
    setShowDeleteConfirm(true);
    setSelectedContainerCompanyId(contnrCmpId);
    setSelectedConatinerCompanyName(contnrCmpName);
  };

  const handleDeleteContainerCompany = async () => {
    try {
      if (selectedContainerCompanyId) {
        const result = await deleteContainerCompany(selectedContainerCompanyId);
        if (result.success) {
          setShowDeleteConfirm(false);
        }
      }
    } catch (error) {}
  };

  const handleCreateContainerCompany = () => {
    setShowCreateContainerCompany(true);
  };

  const renderContent = () => {
    if (containerCompanyLoading && containerCompanies.length === 0) {
      return (
        <div className="flex justify-center items-center h-[90vh]">
          <Loader className="size-8 animate-spin" />
        </div>
      );
    }

    return (
      <div className="mt-4">
        {containerCompanies.map((cntrCmpny) => (
          <div
            key={cntrCmpny._id}
            className="bg-white p-4 rounded-xl shadow-sm hover:shadow-gray-500 flex justify-between items-center px-4 py-4 mb-2.5"
          >
            <p className="text-sm font-semibold text-gray-800">
              {cntrCmpny.containerCompanyName}
            </p>

            <div className="flex gap-3 items-center">
              <p className="text-[12px] text-gray-500">
                Created Date : {formatDate(cntrCmpny.createdAt)}
              </p>

              <div
                onClick={() =>
                  handleShowDeleteConfirm(
                    cntrCmpny._id,
                    cntrCmpny.containerCompanyName
                  )
                }
              >
                <Trash2
                  size={16}
                  className="text-gray-500 hover:text-red-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div>
        <PageHeader
          mainHead="Created container-company"
          subText={`${paginationData.totalItems} ${
            paginationData.totalItems > 1 ? "companies" : "company"
          } `}
          onCreate={handleCreateContainerCompany}
        />
      </div>
      {renderContent()}

      {showCreateContainerCompany && (
        <CreateContainerCompanyForm
          onCreateContainerCompany={createContainerCompany}
          setShowCreateContainerCompany={setShowCreateContainerCompany}
          isCreating={isCreating}
          lineId={lineId}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <ConfirmAlert
            alertInfo={`Do you want to delete container-company ${selectedConatinerCompanyName} ?`}
            handleClose={() => setShowDeleteConfirm(false)}
            handleSubmit={handleDeleteContainerCompany}
            isDeleting={isDeleting}
          />
        </div>
      )}
    </div>
  );
};

export default ContainerCompanies;
