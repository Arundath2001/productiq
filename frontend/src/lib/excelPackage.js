import ExcelJS from 'exceljs';

/**
 * Export packages data to Excel format using ExcelJS (Single Sheet Version)
 * @param {Array} packages - Array of package objects
 * @param {string} companyName - Selected company name
 * @param {string} voyageName - Selected voyage name
 */
export const exportPackagesToExcel = async (packages, companyName = '', voyageName = '') => {
    if (!packages || packages.length === 0) {
        alert('No data to export');
        return;
    }

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Package Management System';
    workbook.lastModifiedBy = 'System';
    workbook.created = new Date();

    // Create single worksheet for all packages
    const worksheet = workbook.addWorksheet('Package Details');

    // Set column widths
    worksheet.columns = [
        { header: 'Product Code', key: 'productCode', width: 20 },
        { header: 'QTY', key: 'qty', width: 10 },
        { header: 'Tracking No', key: 'trackingNo', width: 20 }
    ];

    let currentRow = 1;

    packages.forEach((pkg, packageIndex) => {
        // Add package header
        const packageHeader = `${pkg.goniId.goniName} - ${pkg.goniNumber}`;
        worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
        const headerCell = worksheet.getCell(`A${currentRow}`);
        headerCell.value = packageHeader;
        headerCell.font = {
            bold: true,
            size: 16,
            color: { argb: 'FF000000' }
        };
        headerCell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        // Removed background color from header
        headerCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        currentRow++;

        // Add column headers (no gap)
        const columnHeaderRow = worksheet.addRow(['Product Code', 'QTY', 'Tracking No']);
        columnHeaderRow.font = { bold: true };
        columnHeaderRow.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };

        // Add borders to header row
        columnHeaderRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        currentRow++;

        // Sort products by sequence number for better organization
        const sortedProducts = pkg.products.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

        // Add individual product rows with styling
        sortedProducts.forEach(product => {
            const dataRow = worksheet.addRow([
                product.productCode,
                product.sequenceNumber, // Using sequence number as QTY
                product.trackingNumber
            ]);

            // Add borders and alignment to data rows
            dataRow.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle'
                };
            });
            currentRow++;
        });

        // Add total pieces row immediately after products (no gap)
        const totalPieces = pkg.products.length;
        const totalRow = worksheet.addRow(['Total No of Pieces:', '', totalPieces]);
        const totalRowIndex = totalRow.number;

        // Merge first two columns for "Total No of Pieces:" text
        worksheet.mergeCells(`A${totalRowIndex}:B${totalRowIndex}`);

        // Style the merged cell (first two columns)
        const mergedCell = worksheet.getCell(`A${totalRowIndex}`);
        mergedCell.value = 'Total No of Pieces:';
        mergedCell.font = { bold: true };
        mergedCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        mergedCell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };

        // Style the third column (total number)
        totalRow.getCell(3).font = { bold: true, color: { argb: 'FF000000' } }; // Black text
        totalRow.getCell(3).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        totalRow.getCell(3).alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        currentRow++;

        // Add gap between packages (only if not the last package)
        if (packageIndex < packages.length - 1) {
            worksheet.addRow([]);
            currentRow++;
        }
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `Package_Details_${companyName ? companyName + '_' : ''}${voyageName ? voyageName + '_' : ''}${timestamp}.xlsx`;

    // Write and download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(link.href);
};

/**
 * Alternative export function for single sheet with all packages using ExcelJS
 * @param {Array} packages - Array of package objects
 * @param {string} companyName - Selected company name
 * @param {string} voyageName - Selected voyage name
 */
export const exportPackagesToSingleSheet = async (packages, companyName = '', voyageName = '') => {
    if (!packages || packages.length === 0) {
        alert('No data to export');
        return;
    }

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Package Management System';
    workbook.lastModifiedBy = 'System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Package Details');

    // Set column widths
    worksheet.columns = [
        { header: 'Product Code', key: 'productCode', width: 20 },
        { header: 'QTY', key: 'qty', width: 10 },
        { header: 'Tracking No', key: 'trackingNo', width: 20 }
    ];

    let currentRow = 1;

    packages.forEach((pkg, packageIndex) => {
        // Add package header
        const packageHeader = `${pkg.goniId.goniName} - ${pkg.goniNumber}`;
        worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
        const packageHeaderCell = worksheet.getCell(`A${currentRow}`);
        packageHeaderCell.value = packageHeader;
        packageHeaderCell.font = {
            bold: true,
            size: 14,
            color: { argb: 'FF000000' }
        };
        packageHeaderCell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        // Removed background color from header
        packageHeaderCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        currentRow++;

        // Add column headers (no gap)
        const columnHeaderRow = worksheet.addRow(['Product Code', 'QTY', 'Tracking No']);
        columnHeaderRow.font = { bold: true };
        columnHeaderRow.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        columnHeaderRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        currentRow++;

        // Sort products by sequence number and add individual product rows
        const sortedProducts = pkg.products.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

        sortedProducts.forEach(product => {
            const dataRow = worksheet.addRow([
                product.productCode,
                product.sequenceNumber, // Using sequence number as displayed value
                product.trackingNumber
            ]);

            dataRow.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle'
                };
            });
            currentRow++;
        });

        // Add total pieces for this package (no gap)
        const totalPieces = pkg.products.length;
        const totalRow = worksheet.addRow(['Total No of Pieces:', '', totalPieces]);
        const totalRowIndex = totalRow.number;

        // Merge first two columns for "Total No of Pieces:" text
        worksheet.mergeCells(`A${totalRowIndex}:B${totalRowIndex}`);

        // Style the merged cell (first two columns)
        const mergedCell = worksheet.getCell(`A${totalRowIndex}`);
        mergedCell.value = 'Total No of Pieces:';
        mergedCell.font = { bold: true };
        mergedCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' } // Light grey like header
        };
        mergedCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        mergedCell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };

        // Style the third column (total number)
        totalRow.getCell(3).font = { bold: true, color: { argb: 'FF000000' } }; // Black text
        totalRow.getCell(3).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' } // Light grey like header
        };
        totalRow.getCell(3).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        totalRow.getCell(3).alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        currentRow++;

        // Add gap between packages (only if not the last package)
        if (packageIndex < packages.length - 1) {
            worksheet.addRow([]);
            currentRow++;
        }
    });

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `Package_Details_${companyName ? companyName + '_' : ''}${voyageName ? voyageName + '_' : ''}${timestamp}.xlsx`;

    // Write and download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(link.href);
};