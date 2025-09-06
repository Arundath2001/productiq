// Install: npm install exceljs
import ExcelJS from 'exceljs';

export const exportVoyageData = async (data, voyageName = null, voyageId = null) => {
    // First group by clientCompany, then by productCode
    const groupedByCompany = data.reduce((acc, item) => {
        const company = item.clientCompany || 'Unknown';
        const productCode = item.productCode;

        if (!acc[company]) {
            acc[company] = {};
        }

        if (!acc[company][productCode]) {
            acc[company][productCode] = {
                clientCompany: company,
                productCode: productCode,
                quantity: 1,
                weight: parseFloat(item.weight) || 0
            };
        } else {
            acc[company][productCode].quantity += 1;
            acc[company][productCode].weight += parseFloat(item.weight) || 0;
        }

        return acc;
    }, {});

    // Smart product code sorting function
    const smartProductCodeSort = (a, b) => {
        const extractParts = (code) => {
            const parts = code.split('-');
            return {
                prefix: parts[0], // MK, ROZA, etc.
                number: parts[parts.length - 1] // The numeric part after the last dash
            };
        };

        const aParts = extractParts(a.productCode);
        const bParts = extractParts(b.productCode);

        // First priority: Sort by prefix (MK before ROZA)
        if (aParts.prefix !== bParts.prefix) {
            return aParts.prefix.localeCompare(bParts.prefix);
        }

        // Second priority: Sort by digit length (groups 3-digit, 4-digit, 5-digit together)
        if (aParts.number.length !== bParts.number.length) {
            return aParts.number.length - bParts.number.length;
        }

        // Third priority: Within same prefix and length, sort numerically
        const aNumValue = parseInt(aParts.number, 10);
        const bNumValue = parseInt(bParts.number, 10);

        if (aNumValue !== bNumValue) {
            return aNumValue - bNumValue;
        }

        // Fallback: If everything is same, sort alphabetically by full code
        return a.productCode.localeCompare(b.productCode);
    };

    // Convert to flat array grouped by company
    const filteredData = [];
    Object.keys(groupedByCompany)
        .sort() // Sort companies alphabetically
        .forEach(company => {
            const companyProducts = Object.values(groupedByCompany[company])
                .map(item => ({
                    ...item,
                    weight: Math.round(item.weight * 100) / 100
                }))
                .sort(smartProductCodeSort); // Use smart sorting instead of localeCompare

            filteredData.push(...companyProducts);
        });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Voyage Data');

    // Define columns with Arabic headers - removed 'NO:' column
    worksheet.columns = [
        { header: 'SL', key: 'sl', width: 5 },
        // { header: 'CLIENT\nCOMPANY\n(شركة العميل)', key: 'clientCompany', width: 15 },
        { header: 'MARK\n(علامة)', key: 'mark', width: 12 },
        { header: 'PART NO', key: 'partNo', width: 15 },
        { header: 'DESC. (وصف)', key: 'desc', width: 20 },
        { header: 'QTY(\nكمية)', key: 'qty', width: 8 },
        { header: 'BSH/REF\nNO: (فاتورة أسواق)\nرقم', key: 'bshRef', width: 15 },
        { header: 'ASWAQ INV\n(الوزن بالكيلو)', key: 'aswaqInv', width: 12 },
        { header: 'WEIGHT IN KG\n(السعر\nللكيلو)', key: 'weight', width: 12 },
        { header: 'PRICE PER\nKG(السعر\nللكيلو)', key: 'pricePerKg', width: 12 },
        { header: 'SHIPPING\nCOST (إجمالي\nتكلفة الشحن)', key: 'shippingCost', width: 12 },
        { header: 'TOTAL\nCTN\nNO:(رقم\nالكرتون)', key: 'totalCtn', width: 10 },
        { header: 'TOTAL NO\nOF\nCTN:(العدد\nالإجمالي\nللكرتون)', key: 'totalNoCtn', width: 12 }
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 60;

    headerRow.eachCell((cell) => {
        cell.font = {
            bold: true,
            size: 10,
            name: 'Arial' // Good for Arabic text
        };
        cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
            readingOrder: 'contextDependent' // Important for mixed RTL/LTR
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFFF' } // White background
        };
    });

    // Add data rows grouped by company with blank rows between companies
    let currentCompany = null;
    let serialNumber = 1;

    filteredData.forEach((item, index) => {
        // Check if we're starting a new company group
        const isNewCompany = currentCompany !== item.clientCompany;

        // Add blank row before new company (except for the first company)
        if (isNewCompany && currentCompany !== null) {
            const blankRow = worksheet.addRow({
                sl: '',
                // clientCompany: '',
                mark: '',
                partNo: '',
                desc: '',
                qty: '',
                bshRef: '',
                aswaqInv: '',
                weight: '',
                pricePerKg: '',
                shippingCost: '',
                totalCtn: '',
                totalNoCtn: ''
            });

            // Style blank row
            blankRow.height = 20;
            blankRow.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle',
                    readingOrder: 'contextDependent'
                };
                cell.font = {
                    size: 10,
                    name: 'Arial'
                };
            });
        }

        // Update current company
        currentCompany = item.clientCompany;

        // Add the data row - removed 'no' field
        const dataRow = worksheet.addRow({
            sl: serialNumber++,
            // clientCompany: item.clientCompany,
            mark: item.productCode,
            partNo: '',
            desc: '',
            qty: item.quantity,
            bshRef: '',
            aswaqInv: '',
            weight: item.weight,
            pricePerKg: '',
            shippingCost: '',
            totalCtn: '',
            totalNoCtn: ''
        });

        // Style data rows
        dataRow.height = 25;
        dataRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle',
                readingOrder: 'contextDependent'
            };
            cell.font = {
                size: 10,
                name: 'Arial'
            };
        });
    });

    // Generate filename
    let filename = 'voyage_data.xlsx';
    if (voyageName) {
        const cleanVoyageName = voyageName.replace(/[<>:"/\\|?*]/g, '_');
        filename = `${cleanVoyageName}_data.xlsx`;
    } else if (voyageId) {
        filename = `voyage_${voyageId}_data.xlsx`;
    }

    // Write file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Download file
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
};