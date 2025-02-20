import React, { useEffect } from 'react';
import { useVoyageStore } from '../store/useVoyageStore.js';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { FaEdit, FaEllipsisV, FaPlus, FaTrash } from 'react-icons/fa';


const AllCodeDetails = () => {
    const { getProductByCode, productByCode } = useVoyageStore();
    const { productCode } = useParams();

    useEffect(() => {
      if (productCode) {
          getProductByCode(productCode);
      }
  }, [productCode, getProductByCode]);
  

    const handlePopUpToggle = (index) => {
        setShowPopUp(showPopUp === index ? null : index);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

    return (
        <div>
            <PageHeader mainHead={productCode} subText={`${productByCode.length} Products`} />

        <div className="mt-5">
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full table-auto border-separate border-spacing-y-2">
            <thead className="bg-white">
              <tr>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  #
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  PRODUCT CODE
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  TRACKING NUMBER
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  SENDED CLIENT COMPANY
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  SENDED DATE 
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 ">
                  CREATED BY
                </th>
                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-600 "></th>
              </tr>
            </thead>
            <tbody>
              {productByCode &&
              productByCode.length > 0 ? (
                productByCode.map((data, index) => (
                  <tr
                    key={data._id}
                    className="bg-white rounded-xl overflow-hidden"
                  >
                    <td className="py-3 px-5 text-sm text-black ">
                      {index + 1}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {data.productCode}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {data.trackingNumber}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {data.clientCompany}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {formatDate(data.uploadedDate)}
                    </td>
                    <td className="py-3 px-5 text-sm text-black ">
                      {data.uploadedBy}
                    </td>
                    <td className="py-3 px-5 text-sm text-black relative">
                      <FaEllipsisV className="cursor-pointer" size={15} onClick={() => handlePopUpToggle(index)} />
                      
                      {/* {showPopUp === index && (
                        <div className="fixed right-5 rounded-xl flex flex-col p-1.5 bg-gray-300 gap-0.5 z-10">
                          <IconButton btnName='Delete' btnType="delete" icon={FaTrash} onClick={() => deleteUser(data._id, "employee")} />
                        </div>
                      )} */}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="py-3 px-5 text-sm text-center text-black"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
            
        </div>
    );
};

export default AllCodeDetails;
