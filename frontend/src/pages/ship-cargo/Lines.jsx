import React from "react";
import PageHeader from "../../components/PageHeader";
import { useLineStore } from "../../store/useLineStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useEffect } from "react";
import { Eye, Loader, Trash2 } from "lucide-react";
import { useState } from "react";
import CreateLineForm from "../../components/CreateLineForm";
import ConfirmAlert from "../../components/ConfirmAlert";
import { useNavigate } from "react-router-dom";

const Lines = () => {
  const {
    lines,
    lineLoading,
    lineError,
    isCreating,
    isDeleting,
    getLines,
    createLine,
    paginationData,
    deleteLine,
  } = useLineStore();

  const { authUser } = useAuthStore();

  const [showCreateLine, setShowCreateLine] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [selectedLineName, setSelectedLineName] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (authUser.branchId) {
      getLines(authUser.branchId);
    }
  }, [authUser.branchId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleShowDeleteConfirm = (lineId, lineName) => {
    setShowDeleteConfirm(true);
    setSelectedLineId(lineId);
    setSelectedLineName(lineName);
  };

  const handleDeleteLine = async () => {
    try {
      if (selectedLineId) {
        const result = await deleteLine(selectedLineId);
        if (result.success) {
          setShowDeleteConfirm(false);
        }
      }
    } catch (error) {}
  };

  const handleCreateLine = () => {
    setShowCreateLine(true);
  };

  const handleViewClick = (lineId) => {
    navigate(`/dashboard/lines/${lineId}/container-company`);
  };

  const renderContent = () => {
    if (lineLoading && lines.length === 0) {
      return (
        <div className="flex justify-center items-center h-[90vh]">
          <Loader className="size-8 animate-spin" />
        </div>
      );
    }

    return (
      <div className="mt-4">
        {lines.map((line) => (
          <div
            key={line._id}
            className="bg-white p-4 rounded-xl shadow-sm hover:shadow-gray-500 flex justify-between items-center px-4 py-2.5 mb-2.5"
          >
            <p className="text-sm font-semibold text-gray-800">
              {line.lineName}
            </p>

            <div className="flex gap-3 items-center">
              <p className="text-[12px] text-gray-500">
                Created Date : {formatDate(line.createdAt)}
              </p>

              <div
                onClick={() => handleViewClick(line._id)}
                className="flex text-sm items-center gap-1.5 rounded-xl border px-2 py-1.5 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 cursor-pointer"
              >
                <Eye size={16} />
                <span>View</span>
              </div>

              <div
                onClick={() => handleShowDeleteConfirm(line._id, line.lineName)}
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
          mainHead="Created Lines"
          subText={`${paginationData.totalItems} ${
            paginationData.totalItems > 1 ? "lines" : "line"
          } `}
          onCreate={handleCreateLine}
        />
      </div>
      {renderContent()}

      {showCreateLine && (
        <CreateLineForm
          onCreateLine={createLine}
          setShowCreateLine={setShowCreateLine}
          isCreating={isCreating}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <ConfirmAlert
            alertInfo={`Do you want to delete Line ${selectedLineName} ?`}
            handleClose={() => setShowDeleteConfirm(false)}
            handleSubmit={handleDeleteLine}
            isDeleting={isDeleting}
          />
        </div>
      )}
    </div>
  );
};

export default Lines;
