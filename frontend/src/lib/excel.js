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

        if (company === productCode && (company.startsWith('T') || /^[A-Z]\d+$/.test(company))) {
            company = 'T-Series';
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

        if (codeA.length !== codeB.length) {
            return codeA.length - codeB.length;
        }

        return codeA.toLowerCase().localeCompare(codeB.toLowerCase());
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

        return a.toLowerCase().localeCompare(b.toLowerCase());
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

    filteredData.forEach((item) => {
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