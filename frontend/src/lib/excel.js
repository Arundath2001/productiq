import * as XLSX from 'xlsx';

export const exportVoyageData = (data) => {
    const filteredData = data
        .map(({ uploadedBy, ...rest }) => rest)
        .sort((a, b) => a.productCode.localeCompare(b.productCode));

    const ws = XLSX.utils.json_to_sheet(filteredData);

    const colWidths = [
        { wch: 5 },  // # column
        { wch: 15 }, // Product Code column
        { wch: 20 }, // Tracking Number column
        { wch: 20 }, // Client Company column
        { wch: 15 }, // Sent Date column
        { wch: 15 }, // Created By column
    ];
    ws['!cols'] = colWidths;

    const header = ['#', 'Product Code', 'Tracking Number', 'Client Company', 'Sent Date', 'Created By'];
    const headerStyle = {
        font: { bold: true },
        alignment: { horizontal: 'center' },
        fill: { fgColor: { rgb: 'D9EAD3' } },
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        },
    };
    XLSX.utils.sheet_add_aoa(ws, [header], { origin: 'A1', skipHeader: true });
    Object.keys(ws).forEach((cell) => {
        if (ws[cell].r1 === 0) {
            ws[cell].s = headerStyle; 
        }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Voyage Data');

    XLSX.writeFile(wb, 'voyage_data.xlsx');
};
