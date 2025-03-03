import React, { useState, useEffect } from "react";
import InputLine from "../components/InputLine";
import BillOfLadingPDF from "./test";
import Modal from "../components/Modal";
import { useBillStore } from "../store/useBillStore";

const BillofLading = ({ bill, onClose }) => {
  const [formData, setFormData] = useState({
    billNo: "",
    codeName: "",
    shipper: "",
    consignee: "",
    notifyAddress: "",
    portLoading: "",
    placeReceipt: "",
    portDischarge: "",
    portDelivery: "",
    telephone: "",
    fax: "",
    issuePlace: "",
    issueDate: "",
    oceanVessel: "",
    voyageNumber: "",
    freightPayableAt: "",
    items: [],
    draft: false,
    negotiable: false,
  });

  const { saveBill, updateBill, editingBill, getBillById } = useBillStore();

  const [isSameAsConsigned, setIsSameAsConsigned] = useState(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (editingBill) {
      setFormData(editingBill);
      setGoodsList(editingBill.items || []);
    } else if (bill && Object.keys(bill).length > 0) {
      setFormData(bill);
      setGoodsList(bill.items || []);
    }
  }, [bill, editingBill]);

  const handleOpenPreview = () => {
    setIsPreviewOpen(true);
  };

  const handleSave = async () => {
    try {
      await saveBill(formData);
      alert("Bill of Lading saved successfully!");
      if (onClose) onClose();
    } catch (error) {
      console.error("Error saving Bill of Lading:", error);
      alert("Failed to save Bill of Lading.");
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
  };

  const [goodsData, setGoodsData] = useState({
    marksNos: "",
    grossWeight: "",
    measurement: "",
    quantityDescription: "",
  });

  const [goodsList, setGoodsList] = useState([]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoodsChange = (e) => {
    setGoodsData({
      ...goodsData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddGoods = () => {
    if (
      !goodsData.marksNos ||
      !goodsData.grossWeight ||
      !goodsData.measurement ||
      !goodsData.quantityDescription
    ) {
      alert("Please fill all fields before adding.");
      return;
    }

    const newGoodsList = [...goodsList, goodsData];

    setGoodsList(newGoodsList);
    setFormData((prevState) => ({
      ...prevState,
      items: newGoodsList,
    }));

    setGoodsData({
      marksNos: "",
      grossWeight: "",
      measurement: "",
      quantityDescription: "",
    });
  };

  const handleRemoveItem = (index) => {
    setGoodsList((prevGoodsList) => {
      const updatedList = prevGoodsList.filter((_, i) => i !== index);

      setFormData((prevFormData) => ({
        ...prevFormData,
        items: updatedList,
      }));

      return updatedList;
    });
  };

  const handleDraftChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      draft: !!e.target.checked,
    }));
  };

  const handleNegoChange = (e) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      negotiable: e.target.checked,
    }));
  };

  const handleConsignedCheckbox = (e) => {
    const isChecked = e.target.checked;
    setIsSameAsConsigned(isChecked);

    setFormData((prev) => ({
      ...prev,
      notifyAddress: isChecked ? "SAME AS CONSIGNED" : "",
    }));
  };

  const splitItemsIntoPages = (items, itemsPerPage = 12) => {
    const pages = [];
    for (let i = 0; i < items.length; i += itemsPerPage) {
      pages.push(items.slice(i, i + itemsPerPage));
    }
    return pages;
  };

  return (
    <div>
      <p className="text-black font-semibold mb-5">Bill of Lading</p>

      <p className="text-black font-semibold bg-gray-300 px-1 py-1 mb-2">
        Shipping Details
      </p>

      <div className="flex flex-row items-center mb-2">
        <input
          type="checkbox"
          checked={formData.draft}
          onChange={handleDraftChange}
        />
        <p className="text-gray-400 text-sm">Draft</p>
      </div>

      <div className="flex flex-row gap-10 mb-4">
        <InputLine
          label="Bill No"
          name="billNo"
          value={formData.billNo}
          onChange={handleInputChange}
          placeholder="Enter Billing Number"
        />
        <InputLine
          label="Code Name"
          name="codeName"
          value={formData.codeName}
          onChange={handleInputChange}
          placeholder="Enter Code Name"
        />
        <InputLine
          label="Shipper"
          name="shipper"
          value={formData.shipper}
          onChange={handleInputChange}
          placeholder="Enter Shipper"
        />
      </div>

      <div className="flex flex-row gap-10 mb-4">
        <div className="w-full flex flex-col gap-1">
          <label className="text-[12px] text-gray-400">
            Consigned order to
          </label>
          <textarea
            name="consignee"
            value={formData.consignee}
            onChange={handleInputChange}
            className="h-20 border border-gray-400 px-2"
            placeholder="Enter the details"
          />
        </div>
        <InputLine
          label="Phone Number"
          name="telephone"
          value={formData.telephone}
          onChange={handleInputChange}
          placeholder="Enter Phone Number"
        />
      </div>

      <div className="flex flex-row gap-10 mb-4">
        <div className="w-full flex flex-col gap-1">
          <label className="text-[12px] text-gray-400">Notify Address</label>
          <textarea
            name="notifyAddress"
            value={formData.notifyAddress}
            onChange={handleInputChange}
            className="h-20 border border-gray-400 px-2"
            placeholder="Enter the details"
            disabled={isSameAsConsigned}
          />
        </div>
        <div className="w-full flex flex-row items-center mb-2">
          <input
            type="checkbox"
            checked={isSameAsConsigned}
            onChange={handleConsignedCheckbox}
          />
          <p className="text-gray-400 text-sm">Same as Consigned Address</p>
        </div>
      </div>

      <div className="flex flex-row gap-10 mb-4">
        <InputLine
          name="portLoading"
          value={formData.portLoading}
          onChange={handleInputChange}
          label="Port of loading"
          placeholder="Enter Port of loading"
        />
        <InputLine
          name="placeReceipt"
          value={formData.placeReceipt}
          onChange={handleInputChange}
          label="Place of Receipt"
          placeholder="Enter place of receipt"
        />
      </div>

      <div className="flex flex-row gap-10 mb-4">
        <InputLine
          name="portDischarge"
          value={formData.portDischarge}
          onChange={handleInputChange}
          label="Port of Discharge"
          placeholder="Enter port of discharge"
        />
        <InputLine
          name="portDelivery"
          value={formData.portDelivery}
          onChange={handleInputChange}
          label="Place of Delivery"
          placeholder="Enter place of delivery"
        />
      </div>

      <div className="flex flex-row gap-10 mb-4">
        <div className="w-full flex flex-col gap-1">
          <label className="text-[12px] text-gray-400">
            For Delivery Apply to
          </label>
          <textarea
            className="h-20 border border-gray-400 px-2"
            placeholder="Enter the details"
          />
        </div>
      </div>

      <div className="flex flex-row gap-10 mb-4">
        <InputLine
          name="oceanVessel"
          value={formData.oceanVessel}
          onChange={handleInputChange}
          label="Ocean Vessel"
          placeholder="Enter ocean vessel"
        />
        <InputLine
          name="voyageNumber"
          value={formData.voyageNumber}
          onChange={handleInputChange}
          label="Voyage Number"
          placeholder="Enter voyage Number"
        />
        <InputLine
          name="freightPayableAt"
          value={formData.freightPayableAt}
          onChange={handleInputChange}
          label="Freight Payable at"
          placeholder="Enter Freight Payable at"
        />
      </div>

      <div className="flex flex-row gap-10 mb-4">
        <InputLine
          name="telephone"
          value={formData.telephone}
          onChange={handleInputChange}
          label="Phone Number"
          placeholder="Enter Phone Number"
        />
        <InputLine
          name="fax"
          value={formData.fax}
          onChange={handleInputChange}
          label="Fax Number"
          placeholder="Enter Fax Number"
        />
      </div>

      <p className="text-black font-semibold bg-gray-300 px-1 py-1 mb-2">
        Goods Details
      </p>

      <div className="flex flex-row gap-10 mb-4">
        <InputLine
          label="Marks and Nos."
          name="marksNos"
          value={goodsData.marksNos}
          onChange={handleGoodsChange}
          placeholder="Enter Marks and Nos."
        />
        <InputLine
          label="Gross Weight, Kg"
          name="grossWeight"
          value={goodsData.grossWeight}
          onChange={handleGoodsChange}
          placeholder="Enter Gross Weight"
        />
        <InputLine
          label="Measurement, meter cube"
          name="measurement"
          value={goodsData.measurement}
          onChange={handleGoodsChange}
          placeholder="Enter Measurement"
        />
      </div>

      <div className="flex flex-row gap-10 mb-4">
        <div className="w-full">
          <label className="text-[12px] text-gray-400">
            Quantity & Description of Goods
          </label>
          <textarea
            name="quantityDescription"
            value={goodsData.quantityDescription}
            onChange={handleGoodsChange}
            className="border border-gray-400 px-2 py-1 w-full h-20"
            placeholder="Enter Quantity & Description"
          />
        </div>
        <div className="w-full flex flex-row items-center mb-4">
          <button
            onClick={handleAddGoods}
            className="bg-black px-4 py-2 text-white rounded-xl"
          >
            + Add
          </button>
        </div>
        <div className="flex flex-row items-center mb-2">
          <input
            type="checkbox"
            checked={formData.negotiable}
            onChange={handleNegoChange}
          />

          <p className="text-gray-400 text-sm">Negotiable</p>
        </div>
      </div>

      {goodsList.length > 0 && (
        <div className="mt-4 mb-4">
          <p className="text-black font-semibold bg-gray-300 px-1 py-1 mb-2">
            Added Goods
          </p>

          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 px-4 py-2">
                  Marks & Nos.
                </th>
                <th className="border border-gray-400 px-4 py-2">
                  Gross Weight (Kg)
                </th>
                <th className="border border-gray-400 px-4 py-2">
                  Measurement (m³)
                </th>
                <th className="border border-gray-400 px-4 py-2">
                  Quantity & Description
                </th>
                <th className="border border-gray-400 px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {goodsList.map((item, index) => (
                <tr key={index} className="text-center">
                  <td className="border border-gray-400 px-4 py-2">
                    {item.marksNos}
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {item.grossWeight}
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {item.measurement}
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {item.quantityDescription}
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-black font-semibold bg-gray-300 px-1 py-1 mb-2">
        Signed By
      </p>

      <div className="flex flex-row gap-10 mb-4">
        <InputLine
          label="Place of Issue"
          name="issuePlace"
          value={formData.issuePlace}
          onChange={handleInputChange}
          placeholder="Enter place of issue"
        />
        <InputLine
          label="Date of Issue"
          name="issueDate"
          value={formData.issueDate}
          onChange={handleInputChange}
          placeholder="Enter date of issue"
        />
      </div>

      <p className="text-black font-semibold bg-gray-300 px-1 py-1 mb-2">
        Save your PDF
      </p>

      

      <div className="justify-center flex items-center mt-8 mb-8">
      <button
        onClick={handleSave}
        className="bg-black rounded-xl px-5 py-3 text-white"
      >
        Save Bill of Lading
      </button>

        {/* <button
          onClick={handleOpenPreview}
          className="bg-black rounded-xl px-5 py-3 text-white"
        >
          Download Invoice
        </button> */}
      </div>
      
    </div>
  );
};

export default BillofLading;
