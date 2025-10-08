import ExcelJS from 'exceljs';

export const exportVoyageData = async (data, voyageName = null, voyageId = null) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return;
    }

    const groupedByCompany = data.reduce((acc, item) => {
        let company = (item.clientCompany || 'Unknown').toString().trim();
        const productCode = (item.productCode || '').toString().trim();

        if (!productCode) {
            return acc;
        }

        if (company === productCode) {
            company = productCode;
        }

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

    const smartProductCodeSort = (a, b) => {
        const codeA = a.productCode.toString().trim();
        const codeB = b.productCode.toString().trim();

        const firstCharA = codeA.charAt(0).toUpperCase();
        const firstCharB = codeB.charAt(0).toUpperCase();

        if (firstCharA !== firstCharB) {
            return firstCharA.localeCompare(firstCharB);
        }

        if (codeA.length !== codeB.length) {
            return codeA.length - codeB.length;
        }

        return codeA.localeCompare(codeB, undefined, {
            sensitivity: 'base',
            numeric: true,
            caseFirst: 'upper'
        });
    };

    const customCompanySort = (a, b) => {
        const specialCompanies = ['FL', 'BLACK TIGER'];

        const aIsSpecial = specialCompanies.includes(a);
        const bIsSpecial = specialCompanies.includes(b);

        if (aIsSpecial && bIsSpecial) {
            if (a === 'FL' && b === 'BLACK TIGER') return -1;
            if (a === 'BLACK TIGER' && b === 'FL') return 1;
            return 0;
        }

        if (aIsSpecial && !bIsSpecial) return 1;
        if (!aIsSpecial && bIsSpecial) return -1;

        const firstCharA = a.charAt(0).toUpperCase();
        const firstCharB = b.charAt(0).toUpperCase();

        if (firstCharA !== firstCharB) {
            return firstCharA.localeCompare(firstCharB);
        }

        const numericPartA = a.substring(1);
        const numericPartB = b.substring(1);

        const numA = parseInt(numericPartA, 10);
        const numB = parseInt(numericPartB, 10);

        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }

        return a.localeCompare(b, undefined, {
            sensitivity: 'base',
            numeric: true
        });
    };

    const filteredData = [];
    const sortedCompanies = Object.keys(groupedByCompany).sort(customCompanySort);

    sortedCompanies.forEach(company => {
        const companyProducts = Object.values(groupedByCompany[company])
            .map(item => ({
                ...item,
                weight: Math.round(item.weight * 100) / 100
            }))
            .sort(smartProductCodeSort);

        filteredData.push(...companyProducts);
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Voyage Data');

    worksheet.columns = [
        { header: 'SL', key: 'sl', width: 5 },
        { header: 'MARK\n(علامة)', key: 'mark', width: 12 },
        { header: 'PART NO', key: 'partNo', width: 15 },
        { header: 'DESC. (وصف)', key: 'desc', width: 20 },
        { header: 'QTY(\nكمية)', key: 'qty', width: 8 },
        { header: 'BSH/REF\nNO: (فاتورة أسواق)\nرقم', key: 'bshRef', width: 15 },
        { header: 'ASWAQ INV\n(الوزن بالكيلو)', key: 'aswaqInv', width: 12 },
        { header: 'WEIGHT IN KG\n(الوزن بالكيلو)', key: 'weight', width: 12 },
        { header: 'PRICE PER\nKG(السعر\nللكيلو)', key: 'pricePerKg', width: 12 },
        { header: 'SHIPPING\nCOST (إجمالي\nتكلفة الشحن)', key: 'shippingCost', width: 12 },
        { header: 'TOTAL\nCTN\nNO:(رقم\nالكرتون)', key: 'totalCtn', width: 10 },
        { header: 'TOTAL NO\nOF\nCTN:(العدد\nالإجمالي\nللكرتون)', key: 'totalNoCtn', width: 12 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 60;

    headerRow.eachCell((cell, colNumber) => {
        let fontColor = 'FF000000'; // Default black

        // Red color for price and shipping cost columns
        if (colNumber === 9 || colNumber === 10) {
            fontColor = 'FFFF0000'; // Red
        }

        // Green color only for TOTAL NO OF CTN (column 12)
        if (colNumber === 12) {
            fontColor = 'FF008000'; // Green
        }

        cell.font = {
            bold: true,
            size: 10,
            name: 'Arial',
            color: { argb: fontColor }
        };
        cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
            readingOrder: 'contextDependent'
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
            fgColor: { argb: 'FFFFFFFF' } // White background for all
        };
    });

    let currentCompany = null;
    let serialNumber = 1;

    filteredData.forEach((item, index) => {
        const isNewCompany = currentCompany !== item.clientCompany;

        if (isNewCompany && currentCompany !== null) {
            const blankRow = worksheet.addRow({
                sl: '',
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

        currentCompany = item.clientCompany;

        const dataRow = worksheet.addRow({
            sl: serialNumber++,
            mark: item.productCode,
            partNo: 'PKT FROM OUTSIDE ONLINE',
            desc: '',
            qty: item.quantity,
            bshRef: 'OUTSIDE',
            aswaqInv: 'ONLY SHPNG',
            weight: item.weight,
            pricePerKg: '$ 5.00',
            shippingCost: '',
            totalCtn: '',
            totalNoCtn: ''
        });

        dataRow.height = 25;

        // Merge cells C and D (partNo and desc)
        worksheet.mergeCells(`C${dataRow.number}:D${dataRow.number}`);

        dataRow.eachCell((cell, colNumber) => {
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

            let fontSize = 10;
            let fontColor = 'FF000000'; // Default black

            // Smaller font for specific columns
            if (colNumber === 3 || colNumber === 4 || colNumber === 6 || colNumber === 7) {
                fontSize = 8;
            }

            // Red color for price and shipping cost columns
            if (colNumber === 9 || colNumber === 10) {
                fontColor = 'FFFF0000'; // Red
            }

            // Green color only for TOTAL NO OF CTN (column 12)
            if (colNumber === 12) {
                fontColor = 'FF008000'; // Green
            }

            cell.font = {
                size: fontSize,
                name: 'Arial',
                color: { argb: fontColor }
            };
        });
    });

    let filename = 'voyage_data.xlsx';
    if (voyageName) {
        const cleanVoyageName = voyageName.replace(/[<>:"/\\|?*]/g, '_');
        filename = `${cleanVoyageName}_data.xlsx`;
    } else if (voyageId) {
        filename = `voyage_${voyageId}_data.xlsx`;
    }

    try {
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (error) {
        throw new Error(`Failed to generate Excel file: ${error.message}`);
    }
};