import requests
import socketio
import random
import time


API_URL = "https://ipv-sidm-project.onrender.com/api/auth/loginsensor"  


WS_URL = "https://ipv-sidm-project.onrender.com"  


def authenticate_sensor(api_key):
    try:
    
        response = requests.post(API_URL, json={"apiKey": api_key})
        
        if response.status_code == 200:
            token = response.json().get("token")
            if token:
                print(f"Token JWT recebido: {token}")
                return token
            else:
                print("Nenhum token recebido da API.")
                return None
        else:
            print(f"Erro ao autenticar o sensor: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Erro na solicitação de autenticação: {e}")
        return None


class SensorSimulator:
    def __init__(self, target):
        
        if target == 0:  
            self.airTemp = random.uniform(280.0, 310.0)
            self.processTemp = random.uniform(290.0, 320.0)
            self.rotationSpeed = random.uniform(800, 3200)
            self.torque = random.uniform(5.0, 90.0)
            self.toolWear = random.uniform(0, 300)
        else:  
            self.airTemp = random.uniform(310.1, 330.0)
            self.processTemp = random.uniform(320.1, 340.0)
            self.rotationSpeed = random.uniform(1600, 3600)
            self.torque = random.uniform(50.0, 100.0)
            self.toolWear = random.uniform(200, 400)
    
    def generateReading(self):
        # Ajusta os valores dos atributos da classe
        self.airTemp = self.adjustValue(self.airTemp, 295.3, 304.5, 0.1)
        self.processTemp = self.adjustValue(self.processTemp, 305.7, 313.7, 0.1)
        self.rotationSpeed = self.adjustValue(self.rotationSpeed, 1168, 2886, 5)
        self.torque = self.adjustValue(self.torque, 3.8, 76.6, 1)
        self.toolWear = self.adjustValue(self.toolWear, 0, 253, 2)
        
        # Mapeamento entre os nomes das colunas e os atributos da classe
        column_to_attribute = {
            'Air temperature [K]': self.airTemp,
            'Process temperature [K]': self.processTemp,
            'Rotational speed [rpm]': self.rotationSpeed,
            'Torque [Nm]': self.torque,
            'Tool wear [min]': self.toolWear
        }
        
        # Extrair colunas e valores separados
        columns = list(column_to_attribute.keys())
        values = [round(value, 2) for value in column_to_attribute.values()]

        # Retornar no formato JSON especificado
        return {
            "columns": columns,
            "values": values
        }

    def adjustValue(self, value, min_val, max_val, step):
        
        change = random.uniform(-step, step)
        value += change
        return max(min_val, min(max_val, value))



def connect_to_websocket(token):
    try:
        
        sio = socketio.Client()

        
        sio.connect(WS_URL, auth={"token": token})
        
        print("Conectado ao WebSocket")

        
        @sio.on('message')
        def on_message(data):
            print(f"Mensagem recebida: {data}")
        
        
        sensor_simulator = SensorSimulator(target=0) 
        
        
        while True:
            
            sensor_data = sensor_simulator.generateReading()
            
         
            sio.emit('sensor_data', sensor_data)
            print(f"Dados enviados: {sensor_data}")

            
            #time.sleep(0.05)

    except Exception as e:
        print(f"Erro ao conectar ao WebSocket: {e}")



if __name__ == "__main__":

    apiKey = input("Insira a API Key do sensor: ")


    token = authenticate_sensor(apiKey)

    if token:
        connect_to_websocket(token)
