import ExcelJS from 'exceljs';

export const exportPackagesToExcel = async (packages, companyName = '', voyageName = '') => {
    if (!packages || packages.length === 0) {
        alert('No data to export');
        return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Package Management System';
    workbook.lastModifiedBy = 'System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Package Details');

    worksheet.columns = [
        { header: 'Product Code', key: 'productCode', width: 20 },
        { header: 'Ctn No', key: 'ctnNo', width: 10 },
        { header: 'Tracking No', key: 'trackingNo', width: 20 }
    ];

    let currentRow = 1;
    let grandTotalPieces = 0;
    let grandTotalWeight = 0;

    packages.forEach((pkg, packageIndex) => {
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
        headerCell.border = {
            top: { style: 'medium' },
            left: { style: 'medium' },
            bottom: { style: 'medium' },
            right: { style: 'medium' }
        };
        currentRow++;

        const columnHeaderRow = worksheet.addRow(['Product Code', 'Ctn No', 'Tracking No']);
        columnHeaderRow.font = { bold: true };
        columnHeaderRow.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };

        columnHeaderRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'medium' },
                left: { style: 'medium' },
                bottom: { style: 'medium' },
                right: { style: 'medium' }
            };
        });
        currentRow++;

        const sortedProducts = pkg.products.sort((a, b) => {
            const aCode = a.productCode || '';
            const bCode = b.productCode || '';

            if (aCode.length !== bCode.length) {
                return aCode.length - bCode.length;
            }

            return aCode.localeCompare(bCode);
        });

        sortedProducts.forEach((product, productIndex) => {
            const dataRow = worksheet.addRow([
                product.productCode,
                product.sequenceNumber,
                product.trackingNumber
            ]);

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

        const totalPieces = pkg.products.length;
        grandTotalPieces += totalPieces;

        const totalPiecesRow = worksheet.addRow(['Total No of Pieces:', '', totalPieces]);
        const totalPiecesRowIndex = totalPiecesRow.number;

        worksheet.mergeCells(`A${totalPiecesRowIndex}:B${totalPiecesRowIndex}`);

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

        totalPiecesRow.getCell(3).font = { bold: true, color: { argb: 'FF000000' } };
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

        const totalWeight = pkg.packageWeight || 0;
        grandTotalWeight += totalWeight;

        const totalWeightRow = worksheet.addRow(['Total Weight:', '', `${totalWeight} Kg`]);
        const totalWeightRowIndex = totalWeightRow.number;

        worksheet.mergeCells(`A${totalWeightRowIndex}:B${totalWeightRowIndex}`);

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

        totalWeightRow.getCell(3).font = { bold: true, color: { argb: 'FF000000' } };
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

        if (packageIndex < packages.length - 1) {
            worksheet.addRow([]);
            currentRow++;
        }
    });

    worksheet.addRow([]);
    currentRow++;

    const grandTotalPiecesRow = worksheet.addRow(['Grand Total Pieces:', '', grandTotalPieces]);
    const grandTotalPiecesRowIndex = grandTotalPiecesRow.number;

    worksheet.mergeCells(`A${grandTotalPiecesRowIndex}:B${grandTotalPiecesRowIndex}`);

    const grandPiecesCell = worksheet.getCell(`A${grandTotalPiecesRowIndex}`);
    grandPiecesCell.value = 'Grand Total Pieces:';
    grandPiecesCell.font = { bold: true, size: 12 };
    grandPiecesCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB3E5FC' }
    };
    grandPiecesCell.border = {
        top: { style: 'medium' },
        left: { style: 'medium' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };
    grandPiecesCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };

    grandTotalPiecesRow.getCell(3).font = { bold: true, size: 12, color: { argb: 'FF000000' } };
    grandTotalPiecesRow.getCell(3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB3E5FC' }
    };
    grandTotalPiecesRow.getCell(3).border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'medium' }
    };
    grandTotalPiecesRow.getCell(3).alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };
    currentRow++;

    const grandTotalWeightRow = worksheet.addRow(['Grand Total Weight:', '', `${grandTotalWeight} Kg`]);
    const grandTotalWeightRowIndex = grandTotalWeightRow.number;

    worksheet.mergeCells(`A${grandTotalWeightRowIndex}:B${grandTotalWeightRowIndex}`);

    const grandWeightCell = worksheet.getCell(`A${grandTotalWeightRowIndex}`);
    grandWeightCell.value = 'Grand Total Weight:';
    grandWeightCell.font = { bold: true, size: 12 };
    grandWeightCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB3E5FC' }
    };
    grandWeightCell.border = {
        top: { style: 'thin' },
        left: { style: 'medium' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
    };
    grandWeightCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };

    grandTotalWeightRow.getCell(3).font = { bold: true, size: 12, color: { argb: 'FF000000' } };
    grandTotalWeightRow.getCell(3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB3E5FC' }
    };
    grandTotalWeightRow.getCell(3).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'medium' }
    };
    grandTotalWeightRow.getCell(3).alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `Package_Details_${companyName ? companyName + '_' : ''}${voyageName ? voyageName + '_' : ''}${timestamp}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(link.href);
};

export const exportPackagesToSingleSheet = async (packages, companyName = '', voyageName = '') => {
    if (!packages || packages.length === 0) {
        alert('No data to export');
        return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Package Management System';
    workbook.lastModifiedBy = 'System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Package Details');

    worksheet.columns = [
        { header: 'Product Code', key: 'productCode', width: 20 },
        { header: 'Ctn No', key: 'ctnNo', width: 10 },
        { header: 'Tracking No', key: 'trackingNo', width: 20 }
    ];

    let currentRow = 1;
    let grandTotalPieces = 0;
    let grandTotalWeight = 0;

    packages.forEach((pkg, packageIndex) => {
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
        packageHeaderCell.border = {
            top: { style: 'medium' },
            left: { style: 'medium' },
            bottom: { style: 'medium' },
            right: { style: 'medium' }
        };
        currentRow++;

        const columnHeaderRow = worksheet.addRow(['Product Code', 'Ctn No', 'Tracking No']);
        columnHeaderRow.font = { bold: true };
        columnHeaderRow.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        columnHeaderRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'medium' },
                left: { style: 'medium' },
                bottom: { style: 'medium' },
                right: { style: 'medium' }
            };
        });
        currentRow++;

        const sortedProducts = pkg.products.sort((a, b) => {
            const aCode = a.productCode || '';
            const bCode = b.productCode || '';

            if (aCode.length !== bCode.length) {
                return aCode.length - bCode.length;
            }

            return aCode.localeCompare(bCode);
        });

        sortedProducts.forEach(product => {
            const dataRow = worksheet.addRow([
                product.productCode,
                product.sequenceNumber,
                product.trackingNumber
            ]);

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

        const totalPieces = pkg.products.length;
        grandTotalPieces += totalPieces;

        const totalPiecesRow = worksheet.addRow(['Total No of Pieces:', '', totalPieces]);
        const totalPiecesRowIndex = totalPiecesRow.number;

        worksheet.mergeCells(`A${totalPiecesRowIndex}:B${totalPiecesRowIndex}`);

        const mergedPiecesCell = worksheet.getCell(`A${totalPiecesRowIndex}`);
        mergedPiecesCell.value = 'Total No of Pieces:';
        mergedPiecesCell.font = { bold: true };
        mergedPiecesCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
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

        totalPiecesRow.getCell(3).font = { bold: true, color: { argb: 'FF000000' } };
        totalPiecesRow.getCell(3).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
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

        const totalWeight = pkg.packageWeight || 0;
        grandTotalWeight += totalWeight;

        const totalWeightRow = worksheet.addRow(['Total Weight:', '', `${totalWeight} Kg`]);
        const totalWeightRowIndex = totalWeightRow.number;

        worksheet.mergeCells(`A${totalWeightRowIndex}:B${totalWeightRowIndex}`);

        const mergedWeightCell = worksheet.getCell(`A${totalWeightRowIndex}`);
        mergedWeightCell.value = 'Total Weight:';
        mergedWeightCell.font = { bold: true };
        mergedWeightCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
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

        totalWeightRow.getCell(3).font = { bold: true, color: { argb: 'FF000000' } };
        totalWeightRow.getCell(3).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
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

        if (packageIndex < packages.length - 1) {
            worksheet.addRow([]);
            currentRow++;
        }
    });

    worksheet.addRow([]);
    currentRow++;

    const grandTotalPiecesRow = worksheet.addRow(['Grand Total Pieces:', '', grandTotalPieces]);
    const grandTotalPiecesRowIndex = grandTotalPiecesRow.number;

    worksheet.mergeCells(`A${grandTotalPiecesRowIndex}:B${grandTotalPiecesRowIndex}`);

    const grandPiecesCell = worksheet.getCell(`A${grandTotalPiecesRowIndex}`);
    grandPiecesCell.value = 'Grand Total Pieces:';
    grandPiecesCell.font = { bold: true, size: 12 };
    grandPiecesCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFEB3B' }
    };
    grandPiecesCell.border = {
        top: { style: 'medium' },
        left: { style: 'medium' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };
    grandPiecesCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };

    grandTotalPiecesRow.getCell(3).font = { bold: true, size: 12, color: { argb: 'FF000000' } };
    grandTotalPiecesRow.getCell(3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFEB3B' }
    };
    grandTotalPiecesRow.getCell(3).border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'medium' }
    };
    grandTotalPiecesRow.getCell(3).alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };
    currentRow++;

    const grandTotalWeightRow = worksheet.addRow(['Grand Total Weight:', '', `${grandTotalWeight} Kg`]);
    const grandTotalWeightRowIndex = grandTotalWeightRow.number;

    worksheet.mergeCells(`A${grandTotalWeightRowIndex}:B${grandTotalWeightRowIndex}`);

    const grandWeightCell = worksheet.getCell(`A${grandTotalWeightRowIndex}`);
    grandWeightCell.value = 'Grand Total Weight:';
    grandWeightCell.font = { bold: true, size: 12 };
    grandWeightCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFEB3B' }
    };
    grandWeightCell.border = {
        top: { style: 'thin' },
        left: { style: 'medium' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
    };
    grandWeightCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };

    grandTotalWeightRow.getCell(3).font = { bold: true, size: 12, color: { argb: 'FF000000' } };
    grandTotalWeightRow.getCell(3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFEB3B' }
    };
    grandTotalWeightRow.getCell(3).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'medium' }
    };
    grandTotalWeightRow.getCell(3).alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `Package_Details_${companyName ? companyName + '_' : ''}${voyageName ? voyageName + '_' : ''}${timestamp}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(link.href);
};