import ExcelJS from 'exceljs';

export const exportVoyageData = async (data, voyageName = null, voyageId = null) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('Invalid or empty data provided');
        return;
    }

    const groupedByCompany = data.reduce((acc, item) => {
        let company = (item.clientCompany || 'Unknown').toString().trim();
        const productCode = (item.productCode || '').toString().trim();

        if (!productCode) {
            return acc;
        }

        // FIXED: Remove the T-Series grouping logic - keep each company separate
        // This was causing T336 and T2898 to be grouped together
        // if (company === productCode && (company.startsWith('T') || /^[A-Z]\d+$/.test(company))) {
        //     company = 'T-Series';
        // }

        // Instead, if company equals productCode, use the productCode as the company name
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

        // Extract the first alphabetical character
        const firstCharA = codeA.charAt(0).toUpperCase();
        const firstCharB = codeB.charAt(0).toUpperCase();

        // First sort by the first character (A, B, C, ..., Z)
        if (firstCharA !== firstCharB) {
            return firstCharA.localeCompare(firstCharB);
        }

        // If same first character, extract the numeric part for proper sorting
        const numericPartA = codeA.substring(1); // Get everything after first character
        const numericPartB = codeB.substring(1);

        // Convert to numbers for comparison if they're numeric
        const numA = parseInt(numericPartA, 10);
        const numB = parseInt(numericPartB, 10);

        // If both are valid numbers, sort numerically
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }

        // If not numeric, fall back to string comparison
        return codeA.localeCompare(codeB, undefined, {
            sensitivity: 'base',  // Case insensitive
            numeric: true         // Handle mixed alphanumeric codes
        });
    };

    const customCompanySort = (a, b) => {
        const specialCompanies = ['FL', 'Black Tiger'];

        const aIsSpecial = specialCompanies.includes(a);
        const bIsSpecial = specialCompanies.includes(b);

        if (aIsSpecial && bIsSpecial) {
            if (a === 'FL' && b === 'Black Tiger') return -1;
            if (a === 'Black Tiger' && b === 'FL') return 1;
            return 0;
        }

        if (aIsSpecial && !bIsSpecial) return 1;
        if (!aIsSpecial && bIsSpecial) return -1;

        // For non-special companies, apply the same smart sorting logic
        // Extract the first alphabetical character
        const firstCharA = a.charAt(0).toUpperCase();
        const firstCharB = b.charAt(0).toUpperCase();

        // First sort by the first character (A, B, C, ..., Z)
        if (firstCharA !== firstCharB) {
            return firstCharA.localeCompare(firstCharB);
        }

        // If same first character, extract the numeric part for proper sorting
        const numericPartA = a.substring(1);
        const numericPartB = b.substring(1);

        // Convert to numbers for comparison if they're numeric
        const numA = parseInt(numericPartA, 10);
        const numB = parseInt(numericPartB, 10);

        // If both are valid numbers, sort numerically (T336 before T2898)
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }

        // If not numeric, fall back to string comparison
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

    headerRow.eachCell((cell) => {
        cell.font = {
            bold: true,
            size: 10,
            name: 'Arial'
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
            fgColor: { argb: 'FFFFFFFF' }
        };
    });

    let currentCompany = null;
    let serialNumber = 1;

    filteredData.forEach((item, index) => {
        // Check if we're starting a new company group
        const isNewCompany = currentCompany !== item.clientCompany;

        // Add blank row before new company (except for the first company)
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

        // Add the data row
        const dataRow = worksheet.addRow({
            sl: serialNumber++,
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

        console.log('Excel file downloaded successfully:', filename);
    } catch (error) {
        console.error('Error generating Excel file:', error);
    }
};