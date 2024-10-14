import socketio
import time
import random

# URL da API onde os dados serão enviados via WebSocket (ajuste conforme necessário)
API_URL = "http://localhost:3000"  # Certifique-se de ajustar a URL e porta para sua API

# Criando o cliente WebSocket
sio = socketio.Client()

# Função que simula a leitura de dados de um sensor
def get_sensor_data():
    # Simulando dados do sensor (ex: temperatura e umidade)
    sensor_data = {
        "sensorId": "sensor-001",  # ID do sensor
        "temperature": round(random.uniform(20.0, 30.0), 2),  # Temperatura simulada
        "humidity": round(random.uniform(30.0, 60.0), 2),  # Umidade simulada
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())  # Data e hora atual
    }
    return sensor_data

# Conectando-se ao servidor WebSocket
@sio.event
def connect():
    print("Conectado ao servidor WebSocket")

# Evento para capturar erros de conexão
@sio.event
def connect_error(data):
    print("Falha na conexão com o servidor WebSocket")

# Evento ao desconectar
@sio.event
def disconnect():
    print("Desconectado do servidor WebSocket")

# Função principal que faz leituras contínuas e envia dados
def main():
    try:
        # Conectando ao servidor WebSocket
        sio.connect(API_URL)

        while True:
            # Simula a leitura dos dados do sensor
            sensor_data = get_sensor_data()
            
            # Envia os dados via WebSocket
            sio.emit('sensor_data', sensor_data)
            
            print(f"Dados enviados: {sensor_data}")

            # Pausa por 10 segundos antes de enviar os próximos dados (ajuste conforme necessário)
            time.sleep(10)
    
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        # Certifique-se de desconectar ao finalizar
        sio.disconnect()

if __name__ == "__main__":
    main()
