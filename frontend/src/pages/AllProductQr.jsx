import React, { useEffect } from 'react'
import PageHead from "../components/PageHeader";
import { useProductCodeStore } from '../store/useProductCodeStore.js';
import { FaEllipsisV } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';


const AllProductQr = () => {

  const {savedProductCodes, issavedProduct, getProductCodes} = useProductCodeStore();

  const navigate = useNavigate();

  useEffect(() => {
    getProductCodes();
    
  },[getProductCodes]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleViewClick = (productCode) => {
    navigate(`/voyages/getproducts/${productCode}`)
  }

  return (
    <div>
      <PageHead mainHead='All Product QR' subText={`${savedProductCodes.length} Saved Codes`} />

      <div className='mt-5'>
          {savedProductCodes && savedProductCodes.length > 0 ? (
            savedProductCodes.map((savedCode, index) => (
              <div key={index} className='flex rounded-xl items-center justify-between bg-white px-4 py-2.5 mb-2.5'>
                <p className='text-sm' >{savedCode.productCode}</p>

                <div className='flex gap-2.5 items-center'>
                  <p>Created Date: {formatDate(savedCode.createdAt)}</p>

                  <div onClick={() => handleViewClick(savedCode.productCode)} className='rounded-xl border px-2.5 py-1.5 cursor-pointer'>
                    View
                  </div>

                  <FaEllipsisV size={15} />

                </div>
              </div>
            ))
          ):(
            <div className="flex flex-col h-screen justify-center items-center text-gray-600">
            <p className="text-xl font-semibold opacity-80">No saved codes available</p>
          </div>
          )}
      </div>
    </div>
  )
}

export default AllProductQr