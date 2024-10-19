const tf = require('@tensorflow/tfjs-node');
import readAndPrintCSV from "./csv"; 

interface SensorData {
    UDI: number;
    airTemperature: number;
    processTemperature: number;
    rotationalSpeed: number;
    torque: number;
    toolWear: number;
    target: number;
    failureType: string;
}

async function tensor() {
    // Lê o CSV de forma assíncrona e aguarda os dados
    const rawData = await readAndPrintCSV("./dataset.csv");

    // Processa os dados após a leitura, verificando se os valores são válidos
    const sensorData: SensorData[] = rawData.map((item: any) => {
        const airTemperature = parseFloat(item['Air temperature [K]']);
        const processTemperature = parseFloat(item['Process temperature [K]']);
        const rotationalSpeed = parseFloat(item['Rotational speed [rpm]']);
        const torque = parseFloat(item['Torque [Nm]']);
        const toolWear = parseFloat(item['Tool wear [min]']);
        const target = parseFloat(item['Target']);
        
        // Verificar se há valores inválidos
        if (isNaN(airTemperature) || isNaN(processTemperature) || isNaN(rotationalSpeed) || isNaN(torque) || isNaN(toolWear) || isNaN(target)) {
            console.log('Valores inválidos encontrados:', item);
        }

        return {
            UDI: parseFloat(item['UDI']),
            airTemperature,
            processTemperature,
            rotationalSpeed,
            torque,
            toolWear,
            target,
            failureType: item['Failure Type']
        };
    });

    // Criar os tensores xs (entrada) e ys (saída), filtrando valores inválidos
    const validData = sensorData.filter(item => 
        !isNaN(item.airTemperature) &&
        !isNaN(item.processTemperature) &&
        !isNaN(item.rotationalSpeed) &&
        !isNaN(item.torque) &&
        !isNaN(item.toolWear) &&
        !isNaN(item.target)
    );

    if (validData.length === 0) {
        console.error('Todos os dados são inválidos. Verifique o arquivo CSV.');
        return;
    }

    const xs = tf.tensor2d(validData.map(item => [
        item.airTemperature,
        item.processTemperature,
        item.rotationalSpeed,
        item.torque,
        item.toolWear
    ]), [validData.length, 5]);

    const ys = tf.tensor2d(validData.map(item => item.target), [validData.length, 1]);

    // Definir o modelo
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [5] }));
    model.add(tf.layers.dense({ units: 1 }));

    // Compilar o modelo
    model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

    // Treinar o modelo
    await model.fit(xs, ys, { epochs: 100 });

    // Fazer uma predição com novos dados
    const prediction = model.predict(tf.tensor2d([[298.8, 308.8, 1551, 44.4, 55]], [1, 5]));
    prediction.print(); // Exibir o resultado da predição
}

// Chama a função principal para executar o códig
//tensor().catch(console.error);

export default tensor;
