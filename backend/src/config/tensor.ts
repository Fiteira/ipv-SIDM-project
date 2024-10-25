import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import path from 'path';
import readAndPrintCSV from './csv';

interface SensorData {
    [key: string]: number | string;
}

async function tensor(newInput: number[] | number[][]) {
    const dataPath = './dataset.csv';
    const modelDir = './tensor_model';
    const modelPath = `${modelDir}/model.json`;

    const sensorData = await loadAndProcessData(dataPath);
    const columnsToUse = Object.keys(sensorData[0]).filter(key => 
        key !== 'UDI' && key !== 'Failure Type' && key !== 'Target' && key !== 'id'
    );

    const xs = tf.tensor2d(sensorData.map(item => columnsToUse.map(key => item[key] as number)));
    const ys = tf.tensor2d(sensorData.map(item => item['Target'] as number), [sensorData.length, 1]);

    let model;
    if (fs.existsSync(modelPath)) {
        console.log('Carregando modelo salvo...');
        model = await tf.loadLayersModel(`file://${modelPath}`);
        console.log('Modelo carregado com sucesso.');
    } else {
        model = createModel(columnsToUse.length);
        await trainAndSaveModel(model, xs, ys, modelDir);
    }

    if (isSequentialModel(model)) {
        await predictFailure(model, newInput);
    } else {
        console.error('O modelo carregado não é do tipo Sequential.');
    }
}

async function loadAndProcessData(filePath: string): Promise<SensorData[]> {
    const rawData = await readAndPrintCSV(filePath);

    return rawData.map((item: any) => {
        const processedItem: SensorData = {};

        Object.keys(item).forEach((key) => {
            if (key !== 'Failure Type') {
                processedItem[key] = parseFloat(item[key]);
            }
        });

        processedItem['Failure Type'] = item['Failure Type'];
        processedItem['Target'] = parseInt(item['Target'], 10);

        return processedItem;
    }).filter(item => 
        Object.keys(item).every(key => 
            key === 'Failure Type' || key === 'Target' || !isNaN(item[key] as number)
        ) && !isNaN(item['Target'] as number)
    );
}

function createModel(inputShape: number): tf.Sequential {
    const model = tf.sequential();
    model.add(tf.layers.dense(
        { 
        units: 300,         // Defines the number of neurons (units) in this layer, allowing it to learn complex patterns
        activation: 'relu',         // Sets the activation function to ReLU, which helps the model handle non-linear relationships
        inputShape: [inputShape],          // Specifies the shape of the input data; inputShape expects an array with one item for each feature
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })  // Adds L2 regularization to the layer, penalizing large weights to reduce over fitting
        }));

    model.add(tf.layers.dropout({ rate: 0.3 }));     // Dropout layer with a 30% dropout rate to prevent overfitting

    model.add(tf.layers.dense({
        units: 128,
        activation: 'relu',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    model.add(tf.layers.dropout({ rate: 0.3 }));

    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));     // dense output layer with 1 unit and sigmoid activation for binary classification
    model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });     // model using the Adam optimizer and binary cross-entropy loss for binary classification
 
    return model;
}

async function trainAndSaveModel(model: tf.Sequential, xs: tf.Tensor, ys: tf.Tensor, modelDir: string) {
    console.log('Treinando o modelo...');

    const weightForNoFailure = 1;
    const weightForFailure = 9661 / 339;

    // Trains the model using the provided input (xs) and output (ys) data
    await model.fit(xs, ys, 
        { 
         // Sets the number of complete passes over the entire dataset; more epochs allow for better learning but can lead to overfitting if too high
        epochs: 40,
        batchSize: 32,
        classWeight: { 0: weightForNoFailure, 1: weightForFailure }
        }
    );
    
    ensureDirectoryExists(modelDir);
    await model.save(`file://${path.resolve(modelDir)}`);
    console.log('Modelo salvo com sucesso.');
}

function ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function isSequentialModel(model: tf.LayersModel): model is tf.Sequential {
    return (model as tf.Sequential).add !== undefined;
}

async function predictFailure(model: tf.LayersModel | tf.Sequential, newInput: number[] | number[][]) {
    console.log('Fazendo predição com novos dados:', newInput);

    const inputData = Array.isArray(newInput[0]) ? newInput as number[][] : [newInput as number[]];
    const predictionsTensor = model.predict(tf.tensor2d(inputData)) as tf.Tensor;
    
    const predictions = await predictionsTensor.array() as number[][];

    if (Array.isArray(predictions) && Array.isArray(predictions[0])) {
        predictions.forEach((predictedValue: number[], index: number) => {
            console.log(predictedValue)
            const result = predictedValue[0] >= 0.6 ? 'Falha detectada' : 'Nenhuma falha';
            console.log(`Resultado da predição para a linha ${index + 1}: ${result}`);
        });
    } else {
        console.error('Formato de predição inesperado:', predictions);
    }
}
export default tensor;
