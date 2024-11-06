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
                print(f"Token JWT received: {token}")
                return token
            else:
                print("No token received from the API.")
                return None
        else:
            print(f"Error authenticating the sensor: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error in the authentication request: {e}")
        return None

class SensorSimulator:
    def __init__(self):
        # Default initialization for normal mode
        self.airTemp = random.uniform(295.3, 299.0)
        self.processTemp = random.uniform(305.7, 310.0)
        self.rotationSpeed = random.uniform(1200, 1600)
        self.torque = random.uniform(15.0, 40.0)
        self.toolWear = random.uniform(0, 100)
        
        # Anomaly control variables
        self.in_anomaly_mode = False
        self.anomaly_duration = 0

    def generateReading(self):
        # Define the chance to start an anomaly (15%)
        anomaly_chance = 0.15

        # Check if in anomaly mode or if a new anomaly should start
        if self.in_anomaly_mode or random.random() < anomaly_chance:
            # If not previously in anomaly, start a new one and set duration
            if not self.in_anomaly_mode:
                self.in_anomaly_mode = True
                self.anomaly_duration = random.randint(5, 10)  # Anomaly duration between 5 and 10 readings

            # Adjust values to anomalous ranges
            self.airTemp = self.adjustValue(self.airTemp, 299.1, 304.0, 0.5)
            self.processTemp = self.adjustValue(self.processTemp, 310.1, 313.0, 0.5)
            self.rotationSpeed = self.adjustValue(self.rotationSpeed, 1400, 2886, 20)
            self.torque = self.adjustValue(self.torque, 45.0, 76.0, 2)
            self.toolWear = self.adjustValue(self.toolWear, 100, 253, 3)

            # Decrement anomaly duration and check if it should return to normal mode
            self.anomaly_duration -= 1
            if self.anomaly_duration <= 0:
                self.in_anomaly_mode = False  # Exit anomaly mode
        else:
            # Adjust values within normal ranges
            self.airTemp = self.adjustValue(self.airTemp, 295.3, 299.0, 0.1)
            self.processTemp = self.adjustValue(self.processTemp, 305.7, 310.0, 0.1)
            self.rotationSpeed = self.adjustValue(self.rotationSpeed, 1200, 1600, 5)
            self.torque = self.adjustValue(self.torque, 15.0, 40.0, 1)
            self.toolWear = self.adjustValue(self.toolWear, 0, 100, 2)
        
        # Mapping between column names and class attributes
        column_to_attribute = {
            'Air temperature [K]': self.airTemp,
            'Process temperature [K]': self.processTemp,
            'Rotational speed [rpm]': self.rotationSpeed,
            'Torque [Nm]': self.torque,
            'Tool wear [min]': self.toolWear
        }
        
        # Extract columns and rounded values
        columns = list(column_to_attribute.keys())
        values = [round(value, 2) for value in column_to_attribute.values()]

        # Return in the specified JSON format
        return {
            "columns": columns,
            "values": values
        }

    def adjustValue(self, value, min_val, max_val, step):
        # Adjusts the value, ensuring it stays within min_val and max_val
        change = random.uniform(-step, step)
        value += change
        return max(min_val, min(max_val, value))

def connect_to_websocket(token):
    try:
        sio = socketio.Client()
        sio.connect(WS_URL, auth={"token": token})
        print("Connected to WebSocket")

        @sio.on('message')
        def on_message(data):
            print(f"Message received: {data}")
        
        sensor_simulator = SensorSimulator()
        
        while True:
            sensor_data = sensor_simulator.generateReading()
            sio.emit('sensor_data', sensor_data)
            print(f"Data sent: {sensor_data}")
            time.sleep(5)

    except Exception as e:
        print(f"Error connecting to WebSocket: {e}")

if __name__ == "__main__":
    apiKey = input("Enter the sensor's API Key: ")
    token = authenticate_sensor(apiKey)
    if token:
        connect_to_websocket(token)
