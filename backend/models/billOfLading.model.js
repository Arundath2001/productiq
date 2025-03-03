import mongoose from "mongoose";

const GoodsSchema = new mongoose.Schema({
  marksNos: { type: String, required: true },
  grossWeight: { type: String, required: true },
  measurement: { type: String, required: true },
  quantityDescription: { type: String, required: true },
});

const BillOfLadingSchema = new mongoose.Schema({
  billNo: { type: String, required: true },
  codeName: { type: String, required: true },
  shipper: { type: String, required: true },
  consignee: { type: String, required: true },
  notifyAddress: { type: String, required: true },
  portLoading: { type: String, required: true },
  placeReceipt: { type: String, required: true },
  portDischarge: { type: String, required: true },
  portDelivery: { type: String, required: true },
  telephone: { type: String, required: true },
  fax: { type: String },
  // leftSection: { type: String },
  // rightSection: { type: String },
  issuePlace: { type: String, required: true },
  issueDate: { type: String, required: true },
  oceanVessel: { type: String, required: true },
  voyageNumber: { type: String, required: true },
  freightPayableAt: { type: String, required: true },
  items: [GoodsSchema],
  draft: { type: Boolean, default: false },
  negotiable: { type: Boolean, default: false },
}, { timestamps: true });

const BillOfLading = mongoose.model("BillOfLading", BillOfLadingSchema);

export default BillOfLading;