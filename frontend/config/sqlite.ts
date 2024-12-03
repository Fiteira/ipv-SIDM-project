import * as SQLite from 'expo-sqlite/legacy';


const db = SQLite.openDatabase('sensorMonitor.db');

const createTables = () => {
  db.transaction(tx => {
    // Tabela Factory
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Factory (
        factoryId INTEGER PRIMARY KEY,
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
        userId INTEGER PRIMARY KEY,
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
        machineId INTEGER PRIMARY KEY,
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
        sensorId INTEGER PRIMARY KEY,
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
        alertId INTEGER PRIMARY KEY,
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
        dataId INTEGER PRIMARY KEY,
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
        maintenanceId INTEGER PRIMARY KEY,
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

const insertFactories = async (factories: { factoryId: number; factoryName: string; location: string }[]) => {
  db.transaction(tx => {
    factories.forEach(({ factoryId, factoryName, location }) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO Factory (factoryId, factoryName, location) VALUES (?, ?, ?);`,
        [factoryId, factoryName, location],
        () => console.log(`Factory inserido/atualizado com sucesso: ID ${factoryId}`),
        (_, error) => {
          console.error('Erro ao inserir/atualizar Factory:', error);
          return false;
        }
      );
    });
  });
};

const insertUsers = async (users: { userId: number; userNumber: number; name: string; role: string; factoryId: number | null }[]) => {
  db.transaction(tx => {
    users.forEach(({ userId, userNumber, name, role, factoryId }) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO User (userId, userNumber, name, role, factoryId) VALUES (?, ?, ?, ?, ?);`,
        [userId, userNumber, name, role, factoryId],
        () => console.log(`User inserido/atualizado com sucesso: ID ${userId}`),
        (_, error) => {
          console.error('Erro ao inserir/atualizar User:', error);
          return false;
        }
      );
    });
  });
};

const insertMachines = async (machines: { machineId: number; machineName: string; factoryId: number; state?: string }[]) => {
  db.transaction(tx => {
    machines.forEach(({ machineId, machineName, factoryId, state = 'active' }) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO Machine (machineId, machineName, factoryId, state) VALUES (?, ?, ?, ?);`,
        [machineId, machineName, factoryId, state],
        () => console.log(`Machine inserido/atualizado com sucesso: ID ${machineId}`),
        (_, error) => {
          console.error('Erro ao inserir/atualizar Machine:', error);
          return false;
        }
      );
    });
  });
};

const insertSensors = async (sensors: { sensorId: number; name: string; sensorType: string; machineId: number; apiKey: string }[]) => {
  db.transaction(tx => {
    sensors.forEach(({ sensorId, name, sensorType, machineId, apiKey }) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO Sensor (sensorId, name, sensorType, machineId, apiKey) VALUES (?, ?, ?, ?, ?);`,
        [sensorId, name, sensorType, machineId, apiKey],
        () => console.log(`Sensor inserido/atualizado com sucesso: ID ${sensorId}`),
        (_, error) => {
          console.error('Erro ao inserir/atualizar Sensor:', error);
          return false;
        }
      );
    });
  });
};

const insertAlerts = async (alerts: { alertId: number; machineId: number; sensorId: number; alertDate: string; severity: string; message: string; state?: string }[]) => {
  db.transaction(tx => {
    alerts.forEach(({ alertId, machineId, sensorId, alertDate, severity, message, state = 'active' }) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO Alert (alertId, machineId, sensorId, alertDate, severity, message, state) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [alertId, machineId, sensorId, alertDate, severity, message, state],
        () => console.log(`Alert inserido/atualizado com sucesso: ID ${alertId}`),
        (_, error) => {
          console.error('Erro ao inserir/atualizar Alert:', error);
          return false;
        }
      );
    });
  });
};

const insertDataEntries = async (dataEntries: { dataId: number; sensorId: number; timestamp: string; value: string }[]) => {
  db.transaction(tx => {
    dataEntries.forEach(({ dataId, sensorId, timestamp, value }) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO Data (dataId, sensorId, timestamp, value) VALUES (?, ?, ?, ?);`,
        [dataId, sensorId, timestamp, value],
        () => console.log(`Data inserido/atualizado com sucesso: ID ${dataId}`),
        (_, error) => {
          console.error('Erro ao inserir/atualizar Data:', error);
          return false;
        }
      );
    });
  });
};

const insertMaintenances = async (maintenances: { maintenanceId: number; machineId: number; maintenanceDate: string; description: string; alertId: number; performedBy: number | null }[]) => {
  db.transaction(tx => {
    maintenances.forEach(({ maintenanceId, machineId, maintenanceDate, description, alertId, performedBy }) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO Maintenance (maintenanceId, machineId, maintenanceDate, description, alertId, performedBy) VALUES (?, ?, ?, ?, ?, ?);`,
        [maintenanceId, machineId, maintenanceDate, description, alertId, performedBy],
        () => console.log(`Maintenance inserido/atualizado com sucesso: ID ${maintenanceId}`),
        (_, error) => {
          console.error('Erro ao inserir/atualizar Maintenance:', error);
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
const getUsers = async (): Promise<any[]> => {
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
const getMachines = async (): Promise<any[]> => {
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
const getSensors = async (): Promise<any[]> => {
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
const getAlerts = async (): Promise<any[]> => {
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
const getData = async (): Promise<any[]> => {
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

interface Maintenance {
  maintenanceId: number;
  machineId: number;
  maintenanceDate: string;
  description: string;
  alertId: number;
  performedBy: string;
  machine: {
    machineId: number;
    machineName: string;
    factoryId: number;
    state: string;
  } | null;
  performedUser: {
    factoryId: number;
    userId: number;
    userNumber: number;
    name: string;
    role: string;
  } | null;
}

// Select de todas as manutenções
const getMaintenancesByMachineId = async (machineId: number): Promise<Maintenance[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `
        SELECT 
          Maintenance.*, 
          Machine.machineId AS machineIdFromMachine, 
          Machine.machineName, 
          Machine.factoryId, 
          Machine.state AS machineState, 
          User.userId AS userIdFromUser, 
          User.userNumber, 
          User.name AS userName, 
          User.role 
        FROM Maintenance 
        LEFT JOIN Machine ON Maintenance.machineId = Machine.machineId 
        LEFT JOIN User ON Maintenance.performedBy = User.userId 
        WHERE Maintenance.machineId = ?;
        `,
        [machineId],
        (_, { rows }) => {
          const maintenances: Maintenance[] = rows._array.map(row => ({
            maintenanceId: row.maintenanceId,
            machineId: row.machineId,
            maintenanceDate: row.maintenanceDate,
            description: row.description,
            alertId: row.alertId,
            performedBy: row.performedBy,
            machine: row.machineIdFromMachine
              ? {
                  machineId: row.machineIdFromMachine,
                  machineName: row.machineName,
                  factoryId: row.factoryId,
                  state: row.machineState,
                }
              : null,
            performedUser: row.userIdFromUser
              ? {
                  factoryId: row.factoryId,
                  userId: row.userIdFromUser,
                  userNumber: row.userNumber,
                  name: row.userName,
                  role: row.role,
                }
              : null,
          }));
          resolve(maintenances);
        },
        (_, error) => {
          console.error('Erro ao buscar manutenções:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

const getMaintenanceById = async (maintenanceId: number): Promise<Maintenance> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `
        SELECT 
          Maintenance.*, 
          Machine.machineId AS machineIdFromMachine, 
          Machine.machineName, 
          Machine.factoryId,
          Machine.state AS machineState,
          User.userId AS userIdFromUser,
          User.factoryId ,
          User.userNumber,
          User.name AS userName,
          User.role
        FROM Maintenance
        LEFT JOIN Machine ON Maintenance.machineId = Machine.machineId
        LEFT JOIN User ON Maintenance.performedBy = User.userId
        WHERE Maintenance.maintenanceId = ?;
        `,
        [maintenanceId],
        (_, { rows }) => {
          const row = rows._array[0];
          const maintenance: Maintenance = {
            maintenanceId: row.maintenanceId,
            machineId: row.machineId,
            maintenanceDate: row.maintenanceDate,
            description: row.description,
            alertId: row.alertId,
            performedBy: row.performedBy,
            machine: row.machineIdFromMachine
              ? {
                  machineId: row.machineIdFromMachine,
                  machineName: row.machineName,
                  factoryId: row.factoryId,
                  state: row.machineState,
                }
              : null,
            performedUser: row.userIdFromUser
              ? {
                  factoryId: row.factoryId,
                  userId: row.userIdFromUser,
                  userNumber: row.userNumber,
                  name: row.userName,
                  role: row.role,
                }
              : null,
          };
          resolve(maintenance);
        },
        (_, error) => {
          console.error('Erro ao buscar manutenção por ID:', error);
          reject(error);
          return false;
        }
      );
    }
    );
  }
  );
}


const getUsersByFactory = async (factoryId: string): Promise<any[]> => {
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

const getUserByNumber = async (userNumber: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM User WHERE userNumber = ?;`,
        [userNumber],
        (_, { rows }) => resolve(rows._array[0]),
        (_, error) => {
          console.error('Erro ao buscar usuário por número:', error);
          reject(error);
          return false;
        }
      );
    });
  });
}

const getFactoryById = async (factoryId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Factory WHERE factoryId = ?;`,
        [factoryId],
        (_, { rows }) => resolve(rows._array[0]),
        (_, error) => {
          console.error('Erro ao buscar fábrica por ID:', error);
          reject(error);
          return false;
        }
      );
    });
  });
}

const getMachineById = async (machineId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Machine WHERE machineId = ?;`,
        [machineId],
        (_, { rows }) => resolve(rows._array[0]),
        (_, error) => {
          console.error('Erro ao buscar máquina por ID:', error);
          reject(error);
          return false;
        }
      );
    });
  });
}

const getMachinesByFactory = async (factoryId: string): Promise<any[]> => { 
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Machine WHERE factoryId = ?;`,
        [factoryId],
        (_, { rows }) => resolve(rows._array),
        (_, error) => {
          console.error('Erro ao buscar máquina por fábrica:', error);
          reject(error);
          return false;
        }
      );
    });
  });
}

interface Alerta {
  alertId: number;
  alertDate: string;
  severity: string;
  message: string;
  state: string;
  machineId: number;
  sensorId: number;
  machine: {
    machineId: number;
    machineName: string;
    factoryId: number;
    state: string;
  } | null;
  sensor: {
    sensorId: number;
    name: string;
    sensorType: string;
  } | null;
}

const getAlertsByFactory = async (factoryId: string, page: number, limit: number): Promise<Alerta[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `
        SELECT 
          Alert.alertId, 
          Alert.alertDate, 
          Alert.severity, 
          Alert.message, 
          Alert.state, 
          Alert.machineId, 
          Alert.sensorId, 
          Machine.machineId AS machineIdFromMachine, 
          Machine.machineName, 
          Machine.factoryId AS factoryIdFromMachine, 
          Machine.state AS machineState, 
          Sensor.sensorId AS sensorIdFromSensor, 
          Sensor.name AS sensorName, 
          Sensor.sensorType 
        FROM Alert 
        LEFT JOIN Machine ON Alert.machineId = Machine.machineId 
        LEFT JOIN Sensor ON Alert.sensorId = Sensor.sensorId 
        WHERE Machine.factoryId = ? OR Machine.factoryId IS NULL
        ORDER BY Alert.alertDate DESC 
        LIMIT ? OFFSET ?;
        `,
        [factoryId, limit, (page - 1) * limit],
        (_, { rows }) => {
          const alerts: Alerta[] = rows._array.map(row => ({
            alertId: row.alertId,
            alertDate: row.alertDate,
            severity: row.severity,
            message: row.message,
            state: row.state,
            machineId: row.machineId,
            sensorId: row.sensorId,
            machine: row.machineIdFromMachine
              ? {
                  machineId: row.machineIdFromMachine,
                  machineName: row.machineName,
                  factoryId: row.factoryIdFromMachine,
                  state: row.machineState,
                }
              : null, // Caso não tenha correspondência na tabela Machine
            sensor: row.sensorIdFromSensor
              ? {
                  sensorId: row.sensorIdFromSensor,
                  name: row.sensorName,
                  sensorType: row.sensorType,
                }
              : null, // Caso não tenha correspondência na tabela Sensor
          }));
          resolve(alerts);
        },
        (_, error) => {
          console.error('Erro ao buscar alertas por fábrica:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};



const getAlertById = async (alertId: string): Promise<Alerta> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `
        SELECT 
          Alert.alertId, 
          Alert.alertDate, 
          Alert.severity, 
          Alert.message, 
          Alert.state, 
          Alert.machineId, 
          Alert.sensorId, 
          Machine.machineId AS machineIdFromMachine, 
          Machine.machineName, 
          Machine.factoryId AS factoryIdFromMachine, 
          Machine.state AS machineState, 
          Sensor.sensorId AS sensorIdFromSensor, 
          Sensor.name AS sensorName, 
          Sensor.sensorType 
        FROM Alert 
        LEFT JOIN Machine ON Alert.machineId = Machine.machineId 
        LEFT JOIN Sensor ON Alert.sensorId = Sensor.sensorId 
        WHERE Alert.alertId = ?;
        `,
        [alertId],
        (_, { rows }) => {
          const row = rows._array[0];
          const alert: Alerta = {
            alertId: row.alertId,
            alertDate: row.alertDate,
            severity: row.severity,
            message: row.message,
            state: row.state,
            machineId: row.machineId,
            sensorId: row.sensorId,
            machine: row.machineIdFromMachine
              ? {
                  machineId: row.machineIdFromMachine,
                  machineName: row.machineName,
                  factoryId: row.factoryIdFromMachine,
                  state: row.machineState,
                }
              : null,
            sensor: row.sensorIdFromSensor
              ? {
                  sensorId: row.sensorIdFromSensor,
                  name: row.sensorName,
                  sensorType: row.sensorType,
                }
              : null,
          };
          resolve(alert);
        },
        (_, error) => {
          console.error('Erro ao buscar alerta por ID:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

const getSensorById = async (sensorId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `
        SELECT 
          *
        FROM Sensor 
        WHERE Sensor.sensorId = ?;
        `,
        [sensorId],
        (_, { rows }) => {
          const row = rows._array[0];
          resolve(row);
        },
        (_, error) => {
          console.error('Erro ao buscar sensor por ID:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

const deleteSensorsById = async (sensorIds: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      const placeholders = sensorIds.map(() => '?').join(',');
      tx.executeSql(
        `
        DELETE FROM Sensor
        WHERE sensorId IN (${placeholders});
        `,
        sensorIds,
        () => {
          console.log(`Sensores removidos com sucesso: ${sensorIds.join(', ')}`);
          resolve();
        },
        (_, error) => {
          console.error('Erro ao remover sensores:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

const deleteUserByUserNumber = async (userNumbers: number[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      const placeholders = userNumbers.map(() => '?').join(',');
      tx.executeSql(
        `
        DELETE FROM User
        WHERE userNumber IN (${placeholders});
        `,
        userNumbers,
        () => {
          console.log(`Usuários removidos com sucesso: ${userNumbers.join(', ')}`);
          resolve();
        },
        (_, error) => {
          console.error('Erro ao remover usuários:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

const deleteMachineById = async (machineIds: number[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      const placeholders = machineIds.map(() => '?').join(',');
      tx.executeSql(
        `
        DELETE FROM Machine
        WHERE machineId IN (${placeholders});
        `,
        machineIds,
        () => {
          console.log(`Máquinas removidas com sucesso: ${machineIds.join(', ')}`);
          resolve();
        },
        (_, error) => {
          console.error('Erro ao remover máquinas:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

const deleteFactoryById = async (factoryIds: number[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      const placeholders = factoryIds.map(() => '?').join(',');
      tx.executeSql(
        `
        DELETE FROM Factory
        WHERE factoryId IN (${placeholders});
        `,
        factoryIds,
        () => {
          console.log(`Fábricas removidas com sucesso: ${factoryIds.join(', ')}`);
          resolve();
        },
        (_, error) => {
          console.error('Erro ao remover fábricas:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

const getSensorsByMachineId = async (machineId: number) 
: Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Sensor WHERE machineId = ?;`,
        [machineId],
        (_, { rows }) => resolve(rows._array),
        (_, error) => {
          console.error('Erro ao buscar sensores por máquina:', error);
          reject(error);
          return false;
        }
      );
    });
  });
}


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
  getMaintenancesByMachineId,
  getMaintenanceById,
  getUsersByFactory,
  getUserByNumber,
  getFactoryById,
  getMachineById,
  getMachinesByFactory,
  getAlertsByFactory,
  getAlertById,
  getSensorById,
  getSensorsByMachineId,
  deleteSensorsById,
  deleteUserByUserNumber,
  deleteMachineById,
  deleteFactoryById
};