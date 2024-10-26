import requests
import socketio
import random
import time


API_URL = "http://localhost:3000/api/auth/loginsensor"  


WS_URL = "http://localhost:3000"  


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
            self.airTemp = random.uniform(295.3, 299.0)
            self.processTemp = random.uniform(305.7, 310.0)
            self.rotationSpeed = random.uniform(1200, 1600)
            self.torque = random.uniform(15.0, 40.0)
            self.toolWear = random.uniform(0, 100)
        else:  
            self.airTemp = random.uniform(299.1, 304.0)
            self.processTemp = random.uniform(310.1, 313.0)
            self.rotationSpeed = random.uniform(1400, 2886)
            self.torque = random.uniform(45.0, 76.0)
            self.toolWear = random.uniform(100, 253)
    
    def generateReading(self):
        
        self.airTemp = self.adjustValue(self.airTemp, 295.3, 304.5, 0.1)
        self.processTemp = self.adjustValue(self.processTemp, 305.7, 313.7, 0.1)
        self.rotationSpeed = self.adjustValue(self.rotationSpeed, 1168, 2886, 5)
        self.torque = self.adjustValue(self.torque, 3.8, 76.6, 1)
        self.toolWear = self.adjustValue(self.toolWear, 0, 253, 2)
        
        return {
            "airTemp": round(self.airTemp, 2),
            "processTemp": round(self.processTemp, 2),
            "rotationSpeed": round(self.rotationSpeed, 2),
            "torque": round(self.torque, 2),
            "toolWear": round(self.toolWear, 2)
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

            
            time.sleep(2)

    except Exception as e:
        print(f"Erro ao conectar ao WebSocket: {e}")



if __name__ == "__main__":

    apiKey = input("Insira a API Key do sensor: ")


    token = authenticate_sensor(apiKey)

    if token:
        connect_to_websocket(token)
