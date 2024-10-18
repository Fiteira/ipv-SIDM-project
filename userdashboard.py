import requests
import socketio
import time

# URL da API para login e WebSocket do servidor
API_URL = "http://localhost:3000/api/auth/login"
WS_URL = "http://localhost:3000"

# Função para fazer login e obter o token JWT
def get_jwt_token(user_number, password):
    try:
        # Dados de login (ajuste conforme necessário)
        login_data = {
            "userNumber": user_number,
            "password": password
        }

        # Fazer o POST para a API de login
        response = requests.post(API_URL, json=login_data)

        # Verificar se o login foi bem-sucedido
        if response.status_code == 200:
            # Extrair o token JWT da resposta
            token = response.json().get("token")
            if token:
                print(f"Token JWT recebido: {token}")
                return token
            else:
                print("Nenhum token recebido.")
        else:
            print(f"Falha no login: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Erro ao fazer login: {e}")
    
    return None

# Função para conectar ao WebSocket e simular o dashboard
def simulate_dashboard(user_number, password):
    try:
        # Obter o token JWT via login
        token = get_jwt_token(user_number, password)
        if not token:
            print("Não foi possível obter o token JWT.")
            return

        # Criar cliente Socket.IO
        sio = socketio.Client()

        # Evento para receber dados de sensores
        @sio.on('sensor_data')
        def on_sensor_data(data):
            print(f"Dados recebidos no dashboard: {data}")

        # Função para conectar ao WebSocket com o token JWT
        def connect_to_websocket():
            # Conectar ao WebSocket com o token JWT
            sio.connect(WS_URL, auth={"token": token})
            print("Conectado ao WebSocket usando o token JWT.")

        # Conectar ao WebSocket
        connect_to_websocket()

        # Manter a conexão ativa
        sio.wait()

    except Exception as e:
        print(f"Erro ao conectar ao WebSocket: {e}")

# Simular o usuário no dashboard
if __name__ == "__main__":
    user_number = ""  # Número do usuário
    password = ""  # Senha do usuário

    # Pedir ao usuário para inserir o número e a senha
    user_number = input("Insira o número do usuário: ")
    password = input("Insira a senha do usuário: ")

    # Simular o dashboard do usuário após login
    simulate_dashboard(user_number, password)
    
