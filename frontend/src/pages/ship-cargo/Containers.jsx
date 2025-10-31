import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useSeaContainerStore } from "../../store/useSeaContainerStore";
import { useAuthStore } from "../../store/useAuthStore";
import { Container, Eye, Loader, Trash2 } from "lucide-react";
import ConfirmAlert from "../../components/ConfirmAlert";
import CreateContainer from "../../components/CreateContainer";

const Containers = () => {
  const { seaVoyageId, lineId } = useParams();

  const {
    getSeaContainers,
    seaContainers,
    seaContainerLoading,
    seaContainerError,
    deleteSeaContainer,
    isDeleting,
    createSeaContainer,
    isCreating,
  } = useSeaContainerStore();
  const { authUser } = useAuthStore();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedContainerId, setSelectedContainerId] = useState(null);
  const [selectedContainerNum, setSelectedContainerNum] = useState(null);
  const [showCreateContainer, setShowCreateContainer] = useState(false);

  const status = "pending";

  useEffect(() => {
    if (seaVoyageId && authUser.branchId) {
      getSeaContainers(authUser.branchId, seaVoyageId, 1, status, searchQuery);
    }
  }, [seaVoyageId, authUser.branchId]);

  const handleViewClick = () => {};

  const handleCreateContainer = () => {
    setShowCreateContainer(true);
  };

  const handleShowDeleteConfirm = (containerId, containerNumber) => {
    console.log(containerNumber);

    setShowDeleteConfirm(true);
    setSelectedContainerId(containerId);
    setSelectedContainerNum(containerNumber);
  };

  const handleDeleteContainer = async () => {
    try {
      if (selectedContainerId) {
        const result = await deleteSeaContainer(selectedContainerId);

        if (result.success) {
          setShowDeleteConfirm(false);
        }
      }
    } catch (error) {}
  };

  const renderContent = () => {
    if (seaContainerLoading && seaContainers.length === 0) {
      return (
        <div className="flex justify-center items-center h-[90vh]">
          <Loader className="size-8 animate-spin" />
        </div>
      );
    }

    return (
      <div className="mt-4">
        {seaContainers.map((container) => (
          <div
            key={container._id}
            className="bg-white rounded-xl px-4 py-2.5 mb-2.5 shadow-sm hover:shadow-gray-400 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Container className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Container No : {container.containerNumber}
                </p>
                <p className="text-xs text-gray-500">
                  Company : {container.containerCompanyId.containerCompanyName}
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <p className="text-[12px] text-gray-500">
                Created Date : {formatDate(container.createdAt)}
              </p>

              <div
                onClick={() => handleViewClick(container._id)}
                className="flex text-sm items-center gap-1.5 rounded-xl border px-2 py-1.5 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 cursor-pointer"
              >
                <Eye size={16} />
                <span>View</span>
              </div>

              <div
                onClick={() =>
                  handleShowDeleteConfirm(
                    container._id,
                    container.containerNumber
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
          mainHead={`Sea-Voyage 2 Containers`}
          onCreate={handleCreateContainer}
        />
      </div>
      {renderContent()}

      {showCreateContainer && (
        <CreateContainer
          setShowCreateContainer={setShowCreateContainer}
          onCreateContainer={createSeaContainer}
          isCreating={isCreating}
          seaVoyageId={seaVoyageId}
          lineId={lineId}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <ConfirmAlert
            alertInfo={`Do you want to delete sea container ${selectedContainerNum} ?`}
            handleClose={() => setShowDeleteConfirm(false)}
            handleSubmit={handleDeleteContainer}
            isDeleting={isDeleting}
          />
        </div>
      )}
    </div>
  );
};

export default Containers;
