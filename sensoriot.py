import requests
import socketio
import random
import time

# URL da API para autenticar o sensor e obter o token JWT
API_URL = "http://localhost:3000/api/auth/loginsensor"  # Ajuste a URL conforme necessário

# WebSocket URL
WS_URL = "http://localhost:3000"  # Ajuste a URL conforme necessário

# API Key do sensor
apiKey = "9y8i3zwzbnje3xxcp720tg"

# Função para autenticar o sensor e obter o token JWT
def authenticate_sensor(api_key):
    try:
        # Enviar a API Key para a API e obter o token JWT
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

# Função para conectar ao WebSocket e enviar dados do sensor a cada 10 segundos
def connect_to_websocket(token):
    try:
        conta=0
        # Criar cliente Socket.IO
        sio = socketio.Client()

        # Definir o token JWT no handshake de autenticação
        sio.connect(WS_URL, auth={"token": token})
        
        print("Conectado ao WebSocket")

        # Evento para receber mensagens do servidor
        @sio.on('message')
        def on_message(data):
            print(f"Mensagem recebida: {data}")
        
        # Loop para enviar dados do sensor a cada 10 segundos
        while conta < 50:
            # Gerar valores aleatórios para temperatura e umidade
            temperature = round(random.uniform(20.0, 30.0), 2)
            humidity = round(random.uniform(40.0, 70.0), 2)
            
            # Enviar dados do sensor
            sio.emit('sensor_data', {"temperature": temperature, "humidity": humidity})
            print(f"Dados enviados: Temperatura={temperature}, Umidade={humidity}")

            # Aguardar 10 segundos antes de enviar novos dados
            #time.sleep(10)
            conta+=1

        # Manter a conexão aberta
        # sio.wait()

    except Exception as e:
        print(f"Erro ao conectar ao WebSocket: {e}")


# Fluxo principal
if __name__ == "__main__":
    # Autenticar o sensor e obter o token JWT
    token = authenticate_sensor(apiKey)

    # Se o token for obtido com sucesso, conectar ao WebSocket
    if token:
        connect_to_websocket(token)
