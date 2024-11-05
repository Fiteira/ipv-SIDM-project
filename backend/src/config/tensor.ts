import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import path from 'path';
import readAndPrintCSV from './csv';

interface SensorData {
    columns: string[];
    values: number[][];
}

const anomalyDetection: { prediction: number; data: number[]; }[] = [];
export const COLUMNS_TO_USE = ['Air temperature [K]', 'Process temperature [K]', 'Rotational speed [rpm]', 'Torque [Nm]', 'Tool wear [min]'];
let trainingModel = false;
let loadedModel: tf.Sequential | null = null;

async function tensor(newInput: SensorData) {
    const modelPath = './tensor_model/model.json';

    if (loadedModel) return detectAnomalies(loadedModel, newInput);

    if (trainingModel) {
        while (trainingModel) await new Promise(resolve => setTimeout(resolve, 100));
        return loadedModel ? detectAnomalies(loadedModel, newInput) : [];
    }

    loadedModel = await loadOrTrainModel(modelPath);
    return detectAnomalies(loadedModel, newInput);
}

async function loadOrTrainModel(modelPath: string): Promise<tf.Sequential> {
    if (fs.existsSync(modelPath)) return await tf.loadLayersModel(`file://${modelPath}`) as tf.Sequential;

    trainingModel = true;
    const [sensorData, testData] = await Promise.all([loadAndProcessData('./dataset.csv'), loadAndProcessData('./test_dataset.csv')]);
    const { xs, ys } = prepareTensors(sensorData);
    const { xs: xTest, ys: yTest } = prepareTensors(testData);

    const model = createModel(COLUMNS_TO_USE.length);
    await trainAndSaveModel(model, xs, ys, xTest, yTest, path.dirname(modelPath));
    trainingModel = false;
    return model;
}

async function loadAndProcessData(filePath: string): Promise<SensorData> {
    const rawData = await readAndPrintCSV(filePath);
    return {
        columns: COLUMNS_TO_USE,
        values: rawData.map((item: any) => COLUMNS_TO_USE.map(column => parseFloat(item[column]) || 0))
    };
}

function prepareTensors(data: SensorData) {
    const xs = tf.tensor2d(data.values);
    const ys = tf.tensor2d(data.values.map(row => row[COLUMNS_TO_USE.indexOf('Target')]));
    return { xs, ys };
}

function createModel(inputShape: number): tf.Sequential {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 300, activation: 'relu', inputShape: [inputShape], kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }) }));
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 128, activation: 'relu', kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }) }));
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    model.compile({ optimizer: tf.train.adam(1e-5), loss: 'binaryCrossentropy', metrics: ['accuracy'] });
    return model;
}

async function trainAndSaveModel(model: tf.Sequential, xs: tf.Tensor, ys: tf.Tensor, xTest: tf.Tensor, yTest: tf.Tensor, modelDir: string) {
    await model.fit(xs, ys, {
        epochs: 40,
        batchSize: 32,
        classWeight: { 0: 1, 1: 9661 / 339 },
        validationData: [xTest, yTest]
    });
    await model.save(`file://${modelDir}`);
}

function normalizeColumnName(name: string): string {
    return name.trim().toLowerCase().replace(/[\s\[\]]+/g, '');
}

async function detectAnomalies(model: tf.Sequential, sensorData: SensorData) {
    const normalizedColumns = sensorData.columns.map(normalizeColumnName);
    const expectedColumns = COLUMNS_TO_USE.map(normalizeColumnName);

    if (!expectedColumns.every(col => normalizedColumns.includes(col))) {
        console.error('Error: Sensor data columns do not match COLUMNS_TO_USE.');
        return [];
    }

    console.log("SENSOR DATA" + JSON.stringify(sensorData));

    const data = sensorData.values.map((row) => {
        return expectedColumns.map((col) => {
            const index = normalizedColumns.indexOf(col);
            return index !== -1 && row[index] !== undefined ? row[index] : 0;
        });
    });
    
    
    const predictionsTensor = model.predict(tf.tensor2d(data)) as tf.Tensor;
    const predictions = await predictionsTensor.array() as number[][];

    predictions.forEach((predictedValue, index) => {

        console.log("PREDICTED VALUE: " + predictedValue[0] + "  INDEX:" + data[index] + "\n"); 
        
        if (predictedValue[0] >= 0.50) anomalyDetection.push({ prediction: predictedValue[0], data: data[index] });
        else console.log("dados normais detectados")
    });

    predictionsTensor.dispose();
    return anomalyDetection;
}

export default tensor;
