import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useVoyageStore } from '../store/useVoyageStore.js';
import CreateVoyage from '../components/CreateVoyage.jsx';
import { useNavigate } from 'react-router-dom';


const CompletedVoyages = () => {
    const { completedVoyages, getCompletedVoyages } = useVoyageStore();

    const [showCreateVoyage, setShowCreateVoyage] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
      getCompletedVoyages();
        
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };
    
    // const handleViewClick = (voyageId) => {
    //     navigate(`/voyage/${voyageId}`);
    // }

    return (
        <div>
            <PageHeader mainHead="Completed Voyages" subText={`${completedVoyages.length} voyages`} />

            <div className='mt-10'>
                {completedVoyages.length > 0 ? (
                    <div>
                        {completedVoyages.map((voyage, index) => (
                            <div key={index} className='flex rounded-xl items-center justify-between bg-white px-4 py-2.5 mb-2.5'>
                                <p className='text-black text-sm'>{voyage.voyageName} | {voyage.voyageNumber}/{voyage.year}</p>

                                <div className='flex gap-3 items-center'>
                                    <p>Created Date: {formatDate(voyage.createdAt)}</p>

                                    <div onClick={() => handleViewClick(voyage._id)} className='rounded-xl border px-2.5 py-1.5 cursor-pointer'>
                                        View
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ):(
                    <div>
                        <p>No voyages available.</p>
                    </div>
                )}
            </div>
                {showCreateVoyage && (
                    <div className='fixed inset-0 flex items-center justify-center bg-[#B9B9B969] bg-opacity-50 z-50'>
                        <div className="bg-white p-6 rounded-xl shadow-lg w-96 relative">
                            <CreateVoyage setShowCreateVoyage={setShowCreateVoyage} />
                        </div>
                    </div>
                )}
        </div>
    );
};

export default CompletedVoyages;
