import * as XLSX from 'xlsx';

export const exportVoyageData = (data, voyageName = null, voyageId = null) => {
    const groupedData = data.reduce((acc, item) => {
        const mainProductCode = item.productCode;
        
        if (!acc[mainProductCode]) {
            acc[mainProductCode] = {
                productCode: mainProductCode,
                quantity: 1,
                weight: parseFloat(item.weight) || 0
            };
        } else {
            acc[mainProductCode].quantity += 1;
            acc[mainProductCode].weight += parseFloat(item.weight) || 0;
        }
        
        return acc;
    }, {});

    const filteredData = Object.values(groupedData)
        .map(item => ({
            ...item,
            weight: Math.round(item.weight * 100) / 100
        }))
        .sort((a, b) => a.productCode.localeCompare(b.productCode));

    const ws = XLSX.utils.json_to_sheet(filteredData);
    
    const colWidths = [
        { wch: 20 },
        { wch: 10 }, 
        { wch: 10 }  
    ];
    ws['!cols'] = colWidths;
    
    const header = ['Product Code', 'Quantity', 'Weight (kg)'];
    XLSX.utils.sheet_add_aoa(ws, [header], { origin: 'A1' });
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Voyage Data');
    
    let filename = 'voyage_data.xlsx';
    
    if (voyageName) {
        const cleanVoyageName = voyageName.replace(/[<>:"/\\|?*]/g, '_');
        filename = `${cleanVoyageName}_data.xlsx`;
    } else if (voyageId) {
        filename = `voyage_${voyageId}_data.xlsx`;
    }
    
    XLSX.writeFile(wb, filename);
};