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
        { header: 'Ctn No', key: 'ctnNo', width: 10 },
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
        // Medium border for package header
        headerCell.border = {
            top: { style: 'medium' },
            left: { style: 'medium' },
            bottom: { style: 'medium' },
            right: { style: 'medium' }
        };
        currentRow++;

        // Add column headers (no gap)
        const columnHeaderRow = worksheet.addRow(['Product Code', 'Ctn No', 'Tracking No']);
        columnHeaderRow.font = { bold: true };
        columnHeaderRow.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };

        // Add medium borders to column header row
        columnHeaderRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'medium' },
                left: { style: 'medium' },
                bottom: { style: 'medium' },
                right: { style: 'medium' }
            };
        });
        currentRow++;

        // Sort products alphabetically by productCode (character length wise: shorter strings first, then alphabetical)
        const sortedProducts = pkg.products.sort((a, b) => {
            const aCode = a.productCode || '';
            const bCode = b.productCode || '';

            // First sort by length (shorter strings first)
            if (aCode.length !== bCode.length) {
                return aCode.length - bCode.length;
            }

            // If same length, sort alphabetically
            return aCode.localeCompare(bCode);
        });

        // Add individual product rows with styling
        sortedProducts.forEach((product, productIndex) => {
            const dataRow = worksheet.addRow([
                product.productCode,
                product.sequenceNumber, // Using sequence number as Ctn No
                product.trackingNumber
            ]);

            // Add borders with medium left/right borders for outer edges
            // Make the last product row have medium bottom border
            const isLastProduct = productIndex === sortedProducts.length - 1;
            dataRow.eachCell((cell, colIndex) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: colIndex === 1 ? { style: 'medium' } : { style: 'thin' },
                    bottom: isLastProduct ? { style: 'medium' } : { style: 'thin' },
                    right: colIndex === 3 ? { style: 'medium' } : { style: 'thin' }
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
        const totalPiecesRow = worksheet.addRow(['Total No of Pieces:', '', totalPieces]);
        const totalPiecesRowIndex = totalPiecesRow.number;

        // Merge first two columns for "Total No of Pieces:" text
        worksheet.mergeCells(`A${totalPiecesRowIndex}:B${totalPiecesRowIndex}`);

        // Style the merged cell (first two columns) with medium borders
        const mergedPiecesCell = worksheet.getCell(`A${totalPiecesRowIndex}`);
        mergedPiecesCell.value = 'Total No of Pieces:';
        mergedPiecesCell.font = { bold: true };
        mergedPiecesCell.border = {
            top: { style: 'thin' },
            left: { style: 'medium' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        mergedPiecesCell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };

        // Style the third column (total number) with medium borders
        totalPiecesRow.getCell(3).font = { bold: true, color: { argb: 'FF000000' } }; // Black text
        totalPiecesRow.getCell(3).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'medium' }
        };
        totalPiecesRow.getCell(3).alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        currentRow++;

        // Add total weight row immediately after pieces row (no gap)
        const totalWeight = pkg.packageWeight || 0;
        const totalWeightRow = worksheet.addRow(['Total Weight:', '', totalWeight]);
        const totalWeightRowIndex = totalWeightRow.number;

        // Merge first two columns for "Total Weight:" text
        worksheet.mergeCells(`A${totalWeightRowIndex}:B${totalWeightRowIndex}`);

        // Style the merged cell (first two columns) with medium borders
        const mergedWeightCell = worksheet.getCell(`A${totalWeightRowIndex}`);
        mergedWeightCell.value = 'Total Weight:';
        mergedWeightCell.font = { bold: true };
        mergedWeightCell.border = {
            top: { style: 'thin' },
            left: { style: 'medium' },
            bottom: { style: 'medium' },
            right: { style: 'thin' }
        };
        mergedWeightCell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };

        // Style the third column (total weight) with medium borders
        totalWeightRow.getCell(3).font = { bold: true, color: { argb: 'FF000000' } }; // Black text
        totalWeightRow.getCell(3).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'medium' },
            right: { style: 'medium' }
        };
        totalWeightRow.getCell(3).alignment = {
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
        { header: 'Ctn No', key: 'ctnNo', width: 10 },
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
        // Medium border for package header
        packageHeaderCell.border = {
            top: { style: 'medium' },
            left: { style: 'medium' },
            bottom: { style: 'medium' },
            right: { style: 'medium' }
        };
        currentRow++;

        // Add column headers (no gap)
        const columnHeaderRow = worksheet.addRow(['Product Code', 'Ctn No', 'Tracking No']);
        columnHeaderRow.font = { bold: true };
        columnHeaderRow.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        // Add medium borders to column header row
        columnHeaderRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'medium' },
                left: { style: 'medium' },
                bottom: { style: 'medium' },
                right: { style: 'medium' }
            };
        });
        currentRow++;

        // Sort products alphabetically by productCode (character length wise: shorter strings first, then alphabetical)
        const sortedProducts = pkg.products.sort((a, b) => {
            const aCode = a.productCode || '';
            const bCode = b.productCode || '';

            // First sort by length (shorter strings first)
            if (aCode.length !== bCode.length) {
                return aCode.length - bCode.length;
            }

            // If same length, sort alphabetically
            return aCode.localeCompare(bCode);
        });

        sortedProducts.forEach(product => {
            const dataRow = worksheet.addRow([
                product.productCode,
                product.sequenceNumber, // Using sequence number as displayed value for Ctn No
                product.trackingNumber
            ]);

            // Add borders with medium left/right borders for outer edges
            dataRow.eachCell((cell, colIndex) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: colIndex === 1 ? { style: 'medium' } : { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: colIndex === 3 ? { style: 'medium' } : { style: 'thin' }
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
        const totalPiecesRow = worksheet.addRow(['Total No of Pieces:', '', totalPieces]);
        const totalPiecesRowIndex = totalPiecesRow.number;

        // Merge first two columns for "Total No of Pieces:" text
        worksheet.mergeCells(`A${totalPiecesRowIndex}:B${totalPiecesRowIndex}`);

        // Style the merged cell (first two columns) with medium borders
        const mergedPiecesCell = worksheet.getCell(`A${totalPiecesRowIndex}`);
        mergedPiecesCell.value = 'Total No of Pieces:';
        mergedPiecesCell.font = { bold: true };
        mergedPiecesCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' } // Light grey like header
        };
        mergedPiecesCell.border = {
            top: { style: 'thin' },
            left: { style: 'medium' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        mergedPiecesCell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };

        // Style the third column (total number) with medium borders
        totalPiecesRow.getCell(3).font = { bold: true, color: { argb: 'FF000000' } }; // Black text
        totalPiecesRow.getCell(3).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' } // Light grey like header
        };
        totalPiecesRow.getCell(3).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'medium' }
        };
        totalPiecesRow.getCell(3).alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        currentRow++;

        // Add total weight for this package (no gap)
        const totalWeight = pkg.packageWeight || 0;
        const totalWeightRow = worksheet.addRow(['Total Weight:', '', totalWeight]);
        const totalWeightRowIndex = totalWeightRow.number;

        // Merge first two columns for "Total Weight:" text
        worksheet.mergeCells(`A${totalWeightRowIndex}:B${totalWeightRowIndex}`);

        // Style the merged cell (first two columns) with medium borders
        const mergedWeightCell = worksheet.getCell(`A${totalWeightRowIndex}`);
        mergedWeightCell.value = 'Total Weight:';
        mergedWeightCell.font = { bold: true };
        mergedWeightCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' } // Light grey like header
        };
        mergedWeightCell.border = {
            top: { style: 'thin' },
            left: { style: 'medium' },
            bottom: { style: 'medium' },
            right: { style: 'thin' }
        };
        mergedWeightCell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };

        // Style the third column (total weight) with medium borders
        totalWeightRow.getCell(3).font = { bold: true, color: { argb: 'FF000000' } }; // Black text
        totalWeightRow.getCell(3).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' } // Light grey like header
        };
        totalWeightRow.getCell(3).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'medium' },
            right: { style: 'medium' }
        };
        totalWeightRow.getCell(3).alignment = {
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