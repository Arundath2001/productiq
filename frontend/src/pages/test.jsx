import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  PDFViewer,
} from "@react-pdf/renderer";
import images from "../lib/images";

const BillOfLadingPDF = ({ billData }) => (
  <PDFViewer width="100%" height="500px">
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <View style={styles.logoCont}>
            <Image src={images.logo} style={styles.logo} />

            <View style={styles.iconRow}>
              <Image src={images.location} style={styles.icon} />
              <Text style={styles.whiteText}>Address: </Text>
            </View>

            <View style={styles.iconRow}>
              <Image src={images.call} style={styles.icon} />
              <Text style={styles.whiteText}>Contact Details:</Text>
            </View>
          </View>

          <View style={styles.topRight}>
          <View style={{alignItems: 'center'}}>{billData.draft && <Text style={styles.draftText} >Draft</Text>}</View>
            <Text style={styles.mainText}>Billing of Lading</Text>

            <View style={styles.rowCont}>
              <Text style={styles.label}>
                Bill No: <Text style={styles.pdfData}>{billData.billNo}</Text>{" "}
              </Text>
              <Text style={styles.label}>
                Code Name:{" "}
                <Text style={styles.pdfData}>{billData.codeName}</Text>
              </Text>
            </View>

            <Text style={styles.label}>
              Shipper: <Text style={styles.pdfData}>{billData.shipper}</Text>{" "}
            </Text>

            <View>
              <Text style={styles.label}>Consigned to Order of:</Text>
              <Text style={styles.pdfData}>{billData.consignee}</Text>
            </View>

            <View>
              <Text style={styles.label}>Notify Address:</Text>
              <Text style={styles.pdfData}>{billData.notifyAddress}</Text>
            </View>

            <View style={styles.rowCont}>
              <View style={styles.column}>
                <Text style={styles.label}>Port of Loading:</Text>
                <Text style={styles.pdfData}>{billData.portLoading}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Place of Receipt:</Text>
                <Text style={styles.pdfData}>{billData.placeReceipt}</Text>
              </View>
            </View>

            <View style={styles.rowCont}>
              <View style={styles.column}>
                <Text style={styles.label}>Port of Disc. :</Text>
                <Text style={styles.pdfData}>{billData.portDischarge}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Port of Delivery:</Text>
                <Text style={styles.pdfData}>{billData.portDelivery}</Text>
              </View>
            </View>

            <View style={styles.rowCont}>
              <View style={styles.column}>
                <Text style={styles.label}>Telephone Number:</Text>
                <Text style={styles.pdfData}>{billData.telephone}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Fax Number:</Text>
                <Text style={styles.pdfData}>{billData.fax}</Text>
              </View>
            </View>
          </View>
        </View>

        <View>
          <View style={styles.tableContainer}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableColumn1]}>
                Mark and Nos.
              </Text>
              <Text style={[styles.tableCell, styles.tableColumn1]}>
                Quantity and Description of Goods
              </Text>
              <Text style={[styles.tableCell, styles.tableColumn1]}>
                Gross Weight, Kg
              </Text>
              <Text style={[styles.tableCell, styles.tableColumn1]}>
                Measurement
              </Text>
            </View>

            {billData.items.map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <Text style={[styles.tableData, styles.tableColumn1]}>
                  {item.marksNos}
                </Text>
                <Text style={[styles.tableData, styles.tableColumn1]}>
                  {item.quantityDescription}
                </Text>
                <Text style={[styles.tableData, styles.tableColumn1]}>
                  {item.grossWeight} Kg
                </Text>
                <Text style={[styles.tableData, styles.tableColumn1]}>
                  {item.measurement}
                </Text>
                
              </View>
            ))}
            <View style={{ alignItems: "flex-end" }}>
  {billData.Negotiable && (
    <Text style={styles.negoText}>NOT NEGOTIABLE</Text>
  )}
</View>
          </View>
        </View>


<View style={styles.bottomContainer}>
          <Text style={styles.centeredText}>Particulars above declared shipper</Text>

          <View style={styles.bottomSection}>
            <View style={styles.bottomBox}>
              <Text style={styles.label}>“FREE OUT”</Text>
              <Text style={styles.smallText}>
                CARRIER IS NOT RESPONSIBLE FOR DAMAGE-SHORTAGE-SHORT CONTENTS. {'\n'}WEIGHT, DESCRIPTION AND CONTENT OF CARGO AS DECLARED BY SHIPPERS. {'\n'}SHIPPER LOAD STOW AND COUNT. {'\n'}CONTENTS UNKNOWN TO THE CARRIERS. {'\n'}ALL RELOADING EXPENSES OF EMPTY CONTAINERS AT PORT OF DISCHARGE ON RECEIVER'S / CONSIGNEE ACCOUNT. {'\n'}DEMURRAGE SCALE PER TEU. FIRST 10 DAYS:{'\n'}FREE FROM 11TH TO 20TH DAY: US$ 8.00 / DAY PER TEU FROM 20TH DAY UP TO BACK EMPTY: US$ 16.00 / DAY PER TEU
              </Text>
            </View>
            <View style={styles.bottomBox}>
              <Text style={styles.label}>Right Section Content</Text>
            </View>
          </View>

          <View style={styles.bottomSection}>
            <View style={styles.bottomBoxSmall}>
              <Text style={styles.label}>FREIGHT PREPAID</Text>
            </View>
            <View style={styles.bottomBoxSmall}>
              <Text style={styles.label}>Signed By</Text>
              <Text style={styles.label}>Place of Issue: <Text style={styles.pdfData}>{billData.issuePlace}</Text></Text>
              <Text style={styles.label}>Date: <Text style={styles.pdfData}>{billData.issueDate}</Text></Text>

              <Text style={styles.ptoText}>P.t.o</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  </PDFViewer>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    height: '100%'
  },
  logo: {
    width: 120,
    height: 140,
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  logoCont: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#2C82C4",
    gap: 10,
  },
  icon: {
    width: 10,
    height: 10,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  whiteText: {
    fontSize: 10,
    color: "#FFFFFF",
  },
  topRow: {
    flexDirection: "row",
  },
  mainText: {
    color: "#114FA2",
    fontSize: 12,
    fontStyle: "bold",
  },
  topRight: {
    gap: 10,
    flex: 1,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 10,
    color: "#114FA2",
  },
  rowCont: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 0,
  },
  column: {
    flex: 1,
  },

  tableContainer: {
    marginTop: 20,
    backgroundColor: "#EBF6FF",
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
  },

  tableHeader: {
    fontWeight: "bold",
  },

  tableCell: {
    fontSize: 10,
    color: "#114FA2",
    paddingHorizontal: 5,
    paddingVertical: 3,
  },

  tableColumn1: {
    width: "25%",
    textAlign: "center",
  },
  tableData: {
    color: "#000000",
    fontSize: 10,
  },
  bottomContainer: {
    width: "100%",
    marginTop: "auto"
  },
  bottomSection: {
    flexDirection: "row",
    width: "100%",
  },
  bottomBox: {
    width: "50%",
    borderWidth: 0.8,
    borderColor: "#114FA2",
    padding: 10,
    gap: 6,
  },
  bottomBoxSmall: {
    width: "50%",
    borderWidth: 0.8,
    borderColor: "#114FA2",
    padding: 10,
    gap: 8,
  },
  pdfData: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "900",
    marginTop: 5,
  },
  smallText: {
    fontSize: 7,
    color: "#000000",
    lineHeight: 1.4,
  },
  centeredText: {
    textAlign: "center",
    fontSize: 10,
    color: "#000000",
    fontWeight: "bold",
    marginTop: 5
  },
  ptoText:{
    textAlign: 'right',
    fontSize: 8,
    color: '#114FA2'
  },
  draftText:{
    fontSize: 10,
    backgroundColor: '#EAF04F',
    paddingHorizontal: 10,
    paddingVertical: 2,
    textAlign: 'center'
  },
  negoText: {
    fontSize: 20,
    color: "gray",
    fontWeight: "bold",
    textAlign: "center",
    transform: "rotate(-40deg)", 
    opacity: 0.5
  },
  
  
});

export default BillOfLadingPDF;
