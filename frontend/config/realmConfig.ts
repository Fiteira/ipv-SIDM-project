import Realm, { ObjectSchema } from "realm";

console.log("Inicializando Realm...")
// Esquema de Fábrica
const FactorySchema: ObjectSchema = {
  name: "Factory",
  properties: {
    factoryId: "int", // Chave primária
    factoryName: "string",
    location: "string",
  },
  primaryKey: "factoryId",
};

// Esquema de Máquina
const MachineSchema: ObjectSchema = {
  name: "Machine",
  properties: {
    machineId: "int", // Chave primária
    machineName: "string",
    factoryId: "int",
    state: { type: "string", default: "active" },
  },
  primaryKey: "machineId",
};

// Esquema de Sensor
const SensorSchema: ObjectSchema = {
  name: "Sensor",
  properties: {
    sensorId: "int", // Chave primária
    name: "string",
    sensorType: "string",
    machineId: "int",
    apiKey: "string",
  },
  primaryKey: "sensorId",
};

// Esquema de Alerta
const AlertSchema: ObjectSchema = {
  name: "Alert",
  properties: {
    alertId: "int", // Chave primária
    machineId: "int",
    sensorId: "int",
    alertDate: "date",
    severity: "string",
    message: "string",
    state: { type: "string", default: "active" },
  },
  primaryKey: "alertId",
};

// Esquema de Dados
const DataSchema: ObjectSchema = {
  name: "Data",
  properties: {
    dataId: "int", // Chave primária
    sensorId: "int",
    timestamp: "date",
    value: "string",
  },
  primaryKey: "dataId",
};

// Esquema de Manutenção
const MaintenanceSchema: ObjectSchema = {
  name: "Maintenance",
  properties: {
    maintenanceId: "int", // Chave primária
    machineId: "int",
    maintenanceDate: "date",
    description: "string",
    alertId: "int",
    performedBy: { type: "int", optional: true }, // Relacionamento opcional
  },
  primaryKey: "maintenanceId",
};

// Inicialização do Realm com todos os esquemas
const realmInstance = new Realm({
  schema: [
    FactorySchema,
    MachineSchema,
    SensorSchema,
    AlertSchema,
    DataSchema,
    MaintenanceSchema,
  ],
  schemaVersion: 1, // Atualize este valor ao mudar os esquemas
});

console.log("Realm inicializado com sucesso!: ", realmInstance.path)

export default realmInstance;
