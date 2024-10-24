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

                // Verificar se o UDI faz parte do CSV, normalizando os nomes das colunas
                if (data.length > 0) {
                    const firstRow = data[0];
                    const normalizedKeys = Object.keys(firstRow).map(key => key.trim().toLowerCase());
                resolve(data); // Resolve a promessa com os dados
            }
            })
            .on('error', (error: any) => {
                reject(error); // Rejeita a promessa caso ocorra um erro
            });
    });
}

export default readAndPrintCSV;