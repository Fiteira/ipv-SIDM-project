const fs = require('fs');
const csv = require('csv-parser');

async function readAndPrintCSV(csvFilePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const data: any[] = [];
        
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row: any) => {
                data.push(row);
            })
            .on('end', () => {
                console.log('read the csv file.');

                if (data.length > 0) {
                    const firstRow = data[0];
                    const normalizedKeys = Object.keys(firstRow).map(key => key.trim().toLowerCase());
                resolve(data); 
            }
            })
            .on('error', (error: any) => {
                reject(new Error(error));
            });
    });
}

export default readAndPrintCSV;