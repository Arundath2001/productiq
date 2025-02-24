import * as XLSX from 'xlsx';

export const exportVoyageData = (data) => {
    const groupedData = data.reduce((acc, { productCode, quantity = 1, weight = 0 }) => {
        const mainProductCode = productCode.split('|')[0];
        
        if (!acc[mainProductCode]) {
            acc[mainProductCode] = { productCode: mainProductCode, quantity, weight };
        } else {
            acc[mainProductCode].quantity += quantity;
            acc[mainProductCode].weight += weight;
        }
        return acc;
    }, {});

    const filteredData = Object.values(groupedData).sort((a, b) => a.productCode.localeCompare(b.productCode));

    const ws = XLSX.utils.json_to_sheet(filteredData);


    const colWidths = [
        { wch: 20 }, 
        { wch: 10 }, 
        { wch: 10 }  
    ];
    ws['!cols'] = colWidths;


    const header = ['Product Code', 'Quantity', 'Weight'];
    XLSX.utils.sheet_add_aoa(ws, [header], { origin: 'A1' });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Voyage Data');

    XLSX.writeFile(wb, 'voyage_data.xlsx');
};
