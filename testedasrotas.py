import requests

# Defina a URL base da API
BASE_URL = 'http://localhost:3000/api'

# Função para criar uma fábrica
def create_factory():
    url = f'{BASE_URL}/factories'
    factory_data = {
        "factoryName": "Fábrica A",
        "location": "São Paulo"
    }
    response = requests.post(url, json=factory_data)
    
    if response.status_code == 201:
        factory_id = response.json()['data']['factoryId']
        print(f'Fábrica criada com sucesso: {factory_id}')
        return factory_id
    else:
        print(f'Erro ao criar fábrica: {response.status_code}, {response.text}')
        return None

# Função para criar um usuário
def create_user(factory_id):
    url = f'{BASE_URL}/users'
    user_data = {
        "userNumber": "U12345",
        "name": "John Doe",
        "password": "password123",  # Incluindo o campo password
        "role": "operator",
        "factoryId": factory_id
    }
    response = requests.post(url, json=user_data)
    
    if response.status_code == 201:
        user_id = response.json()['data']['userId']
        print(f'Usuário criado com sucesso: {user_id}')
        return user_id
    else:
        print(f'Erro ao criar usuário: {response.status_code}, {response.text}')
        return None

# Função para criar uma máquina
def create_machine(factory_id):
    url = f'{BASE_URL}/machines'
    machine_data = {
        "machineName": "Máquina A",
        "factoryId": factory_id
    }
    response = requests.post(url, json=machine_data)
    
    if response.status_code == 201:
        machine_id = response.json()['data']['machineId']
        print(f'Máquina criada com sucesso: {machine_id}')
        return machine_id
    else:
        print(f'Erro ao criar máquina: {response.status_code}, {response.text}')
        return None

# Função para criar um sensor
def create_sensor(machine_id):
    url = f'{BASE_URL}/sensors'
    sensor_data = {
        "sensorType": "Temperatura",
        "machineId": machine_id
    }
    response = requests.post(url, json=sensor_data)
    
    if response.status_code == 201:
        sensor_id = response.json()['data']['sensorId']
        print(f'Sensor criado com sucesso: {sensor_id}')
        return sensor_id
    else:
        print(f'Erro ao criar sensor: {response.status_code}, {response.text}')
        return None

# Função para criar manutenção
def create_maintenance(machine_id, user_id):
    url = f'{BASE_URL}/maintenances'
    maintenance_data = {
        "machineId": machine_id,
        "maintenanceDate": "2023-10-10",
        "description": "Troca de peças",
        "performedBy": user_id  # Aqui estamos passando o user_id como performedBy
    }
    response = requests.post(url, json=maintenance_data)
    
    if response.status_code == 201:
        maintenance_id = response.json()['data']['maintenanceId']
        print(f'Manutenção criada com sucesso: {maintenance_id}')
        return maintenance_id
    else:
        print(f'Erro ao criar manutenção: {response.status_code}, {response.text}')
        return None

# Função para criar um alerta
def create_alert(machine_id):
    url = f'{BASE_URL}/alerts'
    alert_data = {
        "machineId": machine_id,
        "alertDate": "2023-10-10",
        "severity": "High",
        "message": "Temperatura alta detectada"
    }
    response = requests.post(url, json=alert_data)
    
    if response.status_code == 201:
        alert_id = response.json()['data']['alertId']
        print(f'Alerta criado com sucesso: {alert_id}')
        return alert_id
    else:
        print(f'Erro ao criar alerta: {response.status_code}, {response.text}')
        return None

# Função para criar um dado de sensor
def create_data(sensor_id):
    url = f'{BASE_URL}/data'
    data_record = {
        "sensorId": sensor_id,
        "timestamp": "2023-10-10T12:00:00",
        "value": 78.5
    }
    response = requests.post(url, json=data_record)
    
    if response.status_code == 201:
        data_id = response.json()['data']['dataId']
        print(f'Dado de sensor criado com sucesso: {data_id}')
        return data_id
    else:
        print(f'Erro ao criar dado de sensor: {response.status_code}, {response.text}')
        return None

# Função para mostrar todos os dados de uma entidade
def get_all_data(entity):
    url = f'{BASE_URL}/{entity}'
    response = requests.get(url)
    if response.status_code == 200:
        print(f'Dados de {entity}: {response.json()}')
    else:
        print(f'Erro ao obter dados de {entity}: {response.status_code}, {response.text}')

# Função para obter dados por ID
def get_by_id(entity, entity_id):
    url = f'{BASE_URL}/{entity}/{entity_id}'
    response = requests.get(url)
    if response.status_code == 200:
        print(f'Dados de {entity} com ID {entity_id}: {response.json()}')
    else:
        print(f'Erro ao obter dados de {entity} com ID {entity_id}: {response.status_code}, {response.text}')

# Função principal para execução das operações
if __name__ == '__main__':
    # Criar uma fábrica
    factory_id = create_factory()

    if factory_id:
        # Criar um usuário
        user_id = create_user(factory_id)

        # Criar uma máquina
        machine_id = create_machine(factory_id)

        if machine_id:
            # Criar um sensor
            sensor_id = create_sensor(machine_id)

            # Criar manutenção associada à máquina e usuário
            maintenance_id = create_maintenance(machine_id, user_id)

            # Criar alerta para a máquina
            alert_id = create_alert(machine_id)

            # Criar um dado de sensor
            data_id = create_data(sensor_id)

            # Mostrar todos os dados de cada entidade
            get_all_data('users')
            get_all_data('factories')
            get_all_data('machines')
            get_all_data('sensors')
            get_all_data('maintenances')
            get_all_data('alerts')
            get_all_data('data')

            # Mostrar dados por ID de cada entidade
            get_by_id('users', user_id)
            get_by_id('factories', factory_id)
            get_by_id('machines', machine_id)
            get_by_id('sensors', sensor_id)
            get_by_id('maintenances', maintenance_id)
            get_by_id('alerts', alert_id)
            get_by_id('data', data_id)
