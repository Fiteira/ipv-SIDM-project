const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
import path from "path";
import readAndPrintCSV from "./csv";
import { log } from "console";
import { raw } from "express";
import { cos } from "@tensorflow/tfjs";

interface SensorData {
    [key: string]: number | string;
}

// Função para garantir que o diretório exista
function ensureDirectoryExistence(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true }); // Cria o diretório, incluindo subdiretórios
    }
}

async function tensor(newInput: number[] | number[][]): Promise<void> {
    // Lê o CSV de forma assíncrona e aguarda os dados
    const rawData = await readAndPrintCSV("./dataset.csv");
    // Processar os dados do CSV para transformar em objetos utilizáveis
    const sensorData: SensorData[] = rawData.map((item: any) => {

        const processedItem: SensorData = {};

        // Para cada sensor, converte os valores para float (excluindo 'UDI' e 'Failure Type')
        Object.keys(item).forEach((key) => {
            if (key !== 'Failure Type') {
                processedItem[key] = parseFloat(item[key]);
            }
        });

        // Certificar-se de que 'Failure Type' e 'Target' estão processados corretamente
        processedItem['Failure Type'] = item['Failure Type'];
        processedItem['Target'] = parseInt(item['Target'], 10); // Adiciona o Target como número

        return processedItem;
    });
    
    // Identificar automaticamente as colunas numéricas para o treinamento
    const allColumns = Object.keys(sensorData[0]);
    const columnsToUse = allColumns.filter(key => key !== 'UDI' && key !== 'Failure Type' && key !== 'Target' && key !== 'id');

    // Filtrar dados inválidos: verificando se todos os valores numéricos são válidos
    const validData = sensorData.filter(item => 
        Object.keys(item).every(key => 
            key === 'Failure Type' || key === 'Target' || !isNaN(item[key] as number)
        ) && !isNaN(item['Target'] as number)
    );

    if (validData.length === 0) {
        console.error('Todos os dados são inválidos. Verifique o arquivo CSV.');
        return;
    }

    // Verificar se já temos um modelo treinado
    let model;
    if (fs.existsSync('./meu_modelo/model.json')) {
        // Carregar o modelo treinado se o arquivo já existir
        console.log('Carregando modelo salvo...');
        model = await tf.loadLayersModel('file://./meu_modelo/model.json');
        console.log('Modelo carregado com sucesso.');
    } else {
        // Treinar o modelo se ele não existir
        console.log('Modelo salvo não encontrado. Treinando novo modelo...');

        // Preparar os tensores xs (entrada) e ys (saída)
        const xs = tf.tensor2d(
            validData.map(item => columnsToUse.map(key => item[key] as number)),
            [validData.length, columnsToUse.length]
        );

        const ys = tf.tensor2d(
            validData.map(item => item['Target'] as number), // Target deve ser binário
            [validData.length, 1]
        );

        // Definir o modelo de rede neural para classificação binária
        model = tf.sequential();
        model.add(tf.layers.dense({ units: 1000, activation: 'relu', inputShape: [xs.shape[1]] }));
        model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // Sigmoid para saída binária

        // Compilar o modelo usando binaryCrossentropy para classificação binária
        model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });

        // Treinar o modelo
        await model.fit(xs, ys, { epochs: 100 });
        try {
        // Diretório onde o modelo será salvo
        const modelDir = './meu_modelo';

        // Garantir que o diretório exista antes de salvar o modelo
        ensureDirectoryExistence(modelDir);

        // Salvar o modelo treinado
        await model.save(`file://${path.resolve(modelDir)}`);
        console.log('Modelo salvo com sucesso.');
        } catch (error) {
            console.error('Erro ao salvar o modelo:', error);
        }
    }

    // Fazer uma predição com novos dados
    console.log('Fazendo predição com novos dados:', newInput);

    // Verificar se newInput é um array de números ou um array de arrays
    let inputData: number[][];
    if (Array.isArray(newInput[0])) {
        // newInput é um array de arrays (múltiplas linhas)
        inputData = newInput as number[][];
    } else {
        // newInput é um array de números (uma única linha)
        inputData = [newInput as number[]];
    }

    // Criar o tensor dinamicamente com base no número de linhas e colunas de inputData
    const prediction = model.predict(tf.tensor2d(inputData, [inputData.length, inputData[0].length])); // Flexível para múltiplas linhas ou uma única linha
    const predictedValues = await prediction.array();  // Obtenha as predições como array

    predictedValues.forEach((predictedValue: number[], index: number) => {
        const resultadoFinal = predictedValue[0] >= 0.5 ? 'Falha detectada' : 'Nenhuma falha';
        console.log(`Resultado final da predição para a linha ${index + 1}:`, resultadoFinal);
    });
}



export default tensor;
