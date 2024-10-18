const fs = require('fs');
const csv = require('csv-parser');

// Função para ler e processar o arquivo CSV e retornar uma promessa
async function readAndPrintCSV(csvFilePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const data: any[] = [];
        
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row: any) => {
                data.push(row);
            })
            .on('end', () => {
                console.log('Leitura do arquivo CSV completa.');
                resolve(data); // Resolve a promessa com os dados
            })
            .on('error', (error: any) => {
                reject(error); // Rejeita a promessa caso ocorra um erro
            });
    });
}

export default readAndPrintCSV;