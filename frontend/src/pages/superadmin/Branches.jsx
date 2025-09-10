import React, { useEffect, useState } from "react";
import { useBranch } from "../../store/useBranchStore.js";
import { Loader } from "lucide-react";
import PageHeader from "../../components/PageHeader.jsx";
import CreateBranch from "../../components/CreateBranch.jsx";
import { useNavigate } from "react-router-dom";
import BranchForm from "../../components/BranchForm.jsx";

const Branches = () => {
  const { branchDetails, getBranches, error, isLoading } = useBranch();
  const [showCreateBranch, setShowCreateBranch] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    getBranches();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleVIewClick = (branchId) => {
    navigate(`/dashboard/branches/${branchId}`);
  };

  const handleCreateBranch = () => {
    setShowCreateBranch(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="size-15 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        mainHead="Created Branches"
        subText={`${branchDetails.length} Branches`}
        onCreate={handleCreateBranch}
        createButtonText="Create Branch"
      />
      <div className="mt-5">
        {branchDetails &&
          branchDetails.map((branch) => (
            <div
              key={branch._id}
              className="flex items-center rounded-xl bg-white shadow-sm p-2 mb-2.5 justify-between"
            >
              <p className="text-sm text-black">{branch.branchName}</p>
              <div className="flex gap-3 items-center">
                <p className="text-sm text-black">
                  Created Date: {formatDate(branch.createdAt)}
                </p>
                <div
                  onClick={() => handleVIewClick(branch._id)}
                  className="rounded-xl border px-2.5 py-2 cursor-pointer"
                >
                  View
                </div>
              </div>
            </div>
          ))}
      </div>
      {showCreateBranch && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50">
          <BranchForm setShowCreateBranch={setShowCreateBranch} />
        </div>
      )}
    </div>
  );
};

export default Branches;
