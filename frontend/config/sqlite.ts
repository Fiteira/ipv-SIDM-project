import * as SQLite from 'expo-sqlite/legacy';

const db = SQLite.openDatabase('sensorMonitor.db');

const createTables = () => {
  db.transaction(tx => {
    // Tabela Factory
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Factory (
        factoryId INTEGER PRIMARY KEY AUTOINCREMENT,
        factoryName TEXT NOT NULL,
        location TEXT
      );`,
      [],
      () => console.log('Tabela Factory criada com sucesso.'),
      (_, error) => {
        console.error('Erro ao criar tabela Factory:', error);
        return false;
      }
    );

    // Tabela User
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS User (
        userId INTEGER PRIMARY KEY AUTOINCREMENT,
        userNumber INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        factoryId INTEGER,
        FOREIGN KEY (factoryId) REFERENCES Factory (factoryId) ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      [],
      () => console.log('Tabela User criada com sucesso.'),
      (_, error) => {
        console.error('Erro ao criar tabela User:', error);
        return false;
      }
    );

    // Tabela Machine
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Machine (
        machineId INTEGER PRIMARY KEY AUTOINCREMENT,
        machineName TEXT NOT NULL,
        factoryId INTEGER NOT NULL,
        state TEXT NOT NULL DEFAULT 'active',
        FOREIGN KEY (factoryId) REFERENCES Factory (factoryId) ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      [],
      () => console.log('Tabela Machine criada com sucesso.'),
      (_, error) => {
        console.error('Erro ao criar tabela Machine:', error);
        return false;
      }
    );

    // Tabela Sensor
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Sensor (
        sensorId INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sensorType TEXT NOT NULL,
        machineId INTEGER NOT NULL,
        apiKey TEXT NOT NULL,
        FOREIGN KEY (machineId) REFERENCES Machine (machineId) ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      [],
      () => console.log('Tabela Sensor criada com sucesso.'),
      (_, error) => {
        console.error('Erro ao criar tabela Sensor:', error);
        return false;
      }
    );

    // Tabela Alert
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Alert (
        alertId INTEGER PRIMARY KEY AUTOINCREMENT,
        machineId INTEGER NOT NULL,
        sensorId INTEGER NOT NULL,
        alertDate DATETIME NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'active',
        FOREIGN KEY (machineId) REFERENCES Machine (machineId) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (sensorId) REFERENCES Sensor (sensorId) ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      [],
      () => console.log('Tabela Alert criada com sucesso.'),
      (_, error) => {
        console.error('Erro ao criar tabela Alert:', error);
        return false;
      }
    );

    // Tabela Data
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Data (
        dataId INTEGER PRIMARY KEY AUTOINCREMENT,
        sensorId INTEGER NOT NULL,
        timestamp DATETIME NOT NULL,
        value TEXT NOT NULL,
        FOREIGN KEY (sensorId) REFERENCES Sensor (sensorId) ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      [],
      () => console.log('Tabela Data criada com sucesso.'),
      (_, error) => {
        console.error('Erro ao criar tabela Data:', error);
        return false;
      }
    );

    // Tabela Maintenance
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Maintenance (
        maintenanceId INTEGER PRIMARY KEY AUTOINCREMENT,
        machineId INTEGER NOT NULL,
        maintenanceDate DATETIME NOT NULL,
        description TEXT NOT NULL,
        alertId INTEGER NOT NULL,
        performedBy INTEGER,
        FOREIGN KEY (machineId) REFERENCES Machine (machineId) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (alertId) REFERENCES Alert (alertId) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (performedBy) REFERENCES User (userId) ON DELETE SET NULL ON UPDATE CASCADE
      );`,
      [],
      () => console.log('Tabela Maintenance criada com sucesso.'),
      (_, error) => {
        console.error('Erro ao criar tabela Maintenance:', error);
        return false;
      }
    );
  });

};

const insertFactories = async (factories: { factoryName: string; location: string }[]) => {
  db.transaction(tx => {
    factories.forEach(({ factoryName, location }) => {
      tx.executeSql(
        `INSERT INTO Factory (factoryName, location) VALUES (?, ?);`,
        [factoryName, location],
        (_, result) => console.log(`Factory inserido com sucesso: ID ${result.insertId}`),
        (_, error) => {
          console.error('Erro ao inserir Factory:', error);
          return false;
        }
      );
    });
  });
};

const insertUsers = async (users: { userNumber: number; name: string; role: string; factoryId: number | null }[]) => {
  db.transaction(tx => {
    users.forEach(({ userNumber, name, role, factoryId }) => {
      tx.executeSql(
        `INSERT INTO User (userNumber, name, role, factoryId) VALUES (?, ?, ?, ?, ?);`,
        [userNumber, name, role, factoryId],
        (_, result) => console.log(`User inserido com sucesso: ID ${result.insertId}`),
        (_, error) => {
          console.error('Erro ao inserir User:', error);
          return false;
        }
      );
    });
  });
};

const insertMachines = async (machines: { machineName: string; factoryId: number; state?: string }[]) => {
  db.transaction(tx => {
    machines.forEach(({ machineName, factoryId, state = 'active' }) => {
      tx.executeSql(
        `INSERT INTO Machine (machineName, factoryId, state) VALUES (?, ?, ?);`,
        [machineName, factoryId, state],
        (_, result) => console.log(`Machine inserido com sucesso: ID ${result.insertId}`),
        (_, error) => {
          console.error('Erro ao inserir Machine:', error);
          return false;
        }
      );
    });
  });
};

const insertSensors = async (sensors: { name: string; sensorType: string; machineId: number; apiKey: string }[]) => {
  db.transaction(tx => {
    sensors.forEach(({ name, sensorType, machineId, apiKey }) => {
      tx.executeSql(
        `INSERT INTO Sensor (name, sensorType, machineId, apiKey) VALUES (?, ?, ?, ?);`,
        [name, sensorType, machineId, apiKey],
        (_, result) => console.log(`Sensor inserido com sucesso: ID ${result.insertId}`),
        (_, error) => {
          console.error('Erro ao inserir Sensor:', error);
          return false;
        }
      );
    });
  });
};

const insertAlerts = async (alerts: { machineId: number; sensorId: number; alertDate: string; severity: string; message: string; state?: string }[]) => {
  db.transaction(tx => {
    alerts.forEach(({ machineId, sensorId, alertDate, severity, message, state = 'active' }) => {
      tx.executeSql(
        `INSERT INTO Alert (machineId, sensorId, alertDate, severity, message, state) VALUES (?, ?, ?, ?, ?, ?);`,
        [machineId, sensorId, alertDate, severity, message, state],
        (_, result) => console.log(`Alert inserido com sucesso: ID ${result.insertId}`),
        (_, error) => {
          console.error('Erro ao inserir Alert:', error);
          return false;
        }
      );
    });
  });
};

const insertDataEntries = async (dataEntries: { sensorId: number; timestamp: string; value: string }[]) => {
  db.transaction(tx => {
    dataEntries.forEach(({ sensorId, timestamp, value }) => {
      tx.executeSql(
        `INSERT INTO Data (sensorId, timestamp, value) VALUES (?, ?, ?);`,
        [sensorId, timestamp, value],
        (_, result) => console.log(`Data inserido com sucesso: ID ${result.insertId}`),
        (_, error) => {
          console.error('Erro ao inserir Data:', error);
          return false;
        }
      );
    });
  });
};

const insertMaintenances = (maintenances: { machineId: number; maintenanceDate: string; description: string; alertId: number; performedBy: number | null }[]) => {
  db.transaction(tx => {
    maintenances.forEach(({ machineId, maintenanceDate, description, alertId, performedBy }) => {
      tx.executeSql(
        `INSERT INTO Maintenance (machineId, maintenanceDate, description, alertId, performedBy) VALUES (?, ?, ?, ?, ?);`,
        [machineId, maintenanceDate, description, alertId, performedBy],
        (_, result) => console.log(`Maintenance inserido com sucesso: ID ${result.insertId}`),
        (_, error) => {
          console.error('Erro ao inserir Maintenance:', error);
          return false;
        }
      );
    });
  });
};

const getFactories = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Factory;`,
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => {
          console.error('Erro ao buscar fábricas:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Select de todos os usuários
const getUsers = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM User;`,
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => {
          console.error('Erro ao buscar usuários:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Select de todas as máquinas
const getMachines = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Machine;`,
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => {
          console.error('Erro ao buscar máquinas:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Select de todos os sensores
const getSensors = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Sensor;`,
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => {
          console.error('Erro ao buscar sensores:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Select de todos os alertas
const getAlerts = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Alert;`,
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => {
          console.error('Erro ao buscar alertas:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Select de todos os dados (Data table)
const getData = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Data;`,
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => {
          console.error('Erro ao buscar dados:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Select de todas as manutenções
const getMaintenances = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Maintenance;`,
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => {
          console.error('Erro ao buscar manutenções:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

const getUsersByFactory = (factoryId: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM User WHERE factoryId = ?;`,
        [factoryId],
        (_, { rows }) => resolve(rows._array),
        (_, error) => {
          console.error('Erro ao buscar usuários por fábrica:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Exporta todas as funções para inserção
export {
  db,
  createTables,
  insertFactories,
  insertUsers,
  insertMachines,
  insertSensors,
  insertAlerts,
  insertDataEntries,
  insertMaintenances,
  getFactories,
  getUsers,
  getMachines,
  getSensors,
  getAlerts,
  getData,
  getMaintenances,
  getUsersByFactory,
};