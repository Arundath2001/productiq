import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useParams } from 'react-router-dom';
import { useVoyageStore } from '../store/useVoyageStore.js';
import { Loader } from 'lucide-react';
import { FaEllipsisV } from 'react-icons/fa';
import { exportVoyageData } from '../lib/excel.js';
import ConfirmAlert from '../components/ConfirmAlert.jsx';

const VoyageDetails = () => {
    const { voyageId } = useParams();
    const { voyageDetails, getVoyageDetails, isVoyageDetails, exportVoyage, deleteVoyageData   } = useVoyageStore();
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedDataId, setSelectedDataId] = useState(null);

    useEffect(() => {
        getVoyageDetails(voyageId);
    }, [voyageId, getVoyageDetails]);

    if (isVoyageDetails) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="size-15 animate-spin" />
            </div>
        );
    }

    if (!voyageDetails) {
        return <div>Voyage not found or no data available.</div>;
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const handleExport = async () => {
        await exportVoyage(voyageId);
        exportVoyageData(voyageDetails.uploadedData);
    }

    const handleShowConfirm = (voyageId) => {
        setSelectedDataId(voyageId);
        setShowConfirm(true);
    }

    const handleDeleteVoyageData = async () => {
        
        if(selectedDataId){
            await deleteVoyageData(voyageId, selectedDataId);
            setShowConfirm(false);
        }
    }

    return (
        <div>
            <PageHeader
                mainHead={`${voyageDetails.voyageName}/ ${voyageDetails.voyageNumber}`}
                subText={`${voyageDetails.uploadedData.length} Products`}
                onExport={handleExport}
            />

            <div className="mt-5 overflow-x-auto">
                <table className="min-w-full table-auto border-separate border-spacing-y-2">
                    <thead className='bg-white'>
                        <tr>
                            <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">#</th>
                            <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">Product Code</th>
                            <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">Tracking Number</th>
                            <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">Client Company</th>
                            <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">Sent Date</th>
                            <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">Created By</th>
                            <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 "></th>
                        </tr>
                    </thead>
                    <tbody>
                        {voyageDetails.uploadedData && voyageDetails.uploadedData.length > 0 ?(
                            voyageDetails.uploadedData.map((data, index) => (
                                <tr key={data._id} className='bg-white rounded-xl overflow-hidden'>
                                    <td className="py-3 px-5 text-sm text-black ">{index + 1}</td>
                                    <td className="py-3 px-5 text-sm text-black ">{data.productCode}</td>
                                    <td className="py-3 px-5 text-sm text-black ">{data.trackingNumber}</td>
                                    <td className="py-3 px-5 text-sm text-black ">{data.clientCompany}</td>
                                    <td className="py-3 px-5 text-sm text-black ">{formatDate(data.uploadedDate)}</td>
                                    <td className="py-3 px-5 text-sm text-black ">{data.uploadedBy}</td>
                                    <td className="py-3 px-5 text-sm text-black ">
                                        <div className='cursor-pointer' onClick={ () => handleShowConfirm(data._id)} > <FaEllipsisV /> </div>
                                    </td>
                                </tr>
                            ))
                        ):(
                            <tr>
                                <td colSpan="7" className="py-3 px-5 text-sm text-center  text-black">No data available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {showConfirm && (
                <div className='fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50'>
                    <ConfirmAlert alertInfo='You want to delete this voyage ?' handleClose={() => setShowConfirm(false)} handleSubmit={handleDeleteVoyageData} />
                </div>
            )}
        </div>
    );
};

export default VoyageDetails;
