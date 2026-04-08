# 📱 API para Aplicações Móveis - Sistema de Estudo para Concursos

## 🚀 Visão Geral

Esta API foi desenvolvida com foco em aplicações móveis (Android e iOS), oferecendo endpoints otimizados e funcionalidades específicas para dispositivos móveis.

## 📋 Características para Apps Móveis

### ✅ Funcionalidades Implementadas (V1)
- ✅ Autenticação JWT
- ✅ Gestão de usuários
- ✅ CRUD de materiais
- ✅ CORS configurado para apps móveis
- ✅ Headers específicos para dispositivos
- ✅ Logging de requisições móveis
- ✅ Respostas padronizadas
- ✅ Health check com informações do dispositivo

### 🔄 Funcionalidades Planejadas (V2)
- 🔄 Upload de arquivos (PDF, imagens)
- 🔄 Notificações push
- 🔄 Sincronização offline
- 🔄 Cache inteligente
- 🔄 Rate limiting por dispositivo
- 🔄 Analytics de uso
- 🔄 Suporte a múltiplos idiomas

## 🔧 Configuração para Apps Móveis

### Headers Necessários

Para identificação do dispositivo móvel, inclua os seguintes headers:

```http
X-Device-ID: unique-device-identifier
X-App-Version: 1.0.0
X-Platform: android|ios
X-Build-Number: 1
Authorization: Bearer <jwt-token>
```

### Exemplo de Requisição

```javascript
// React Native / Flutter / Ionic
const response = await fetch('https://api.seudominio.com/api/v1/materials', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Device-ID': deviceId,
    'X-App-Version': '1.0.0',
    'X-Platform': 'android',
    'X-Build-Number': '1',
  },
});
```

## 📡 Endpoints Principais

### Autenticação
```
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/profile
POST /api/v1/auth/logout
```

### Usuários
```
GET    /api/v1/users
GET    /api/v1/users/:id
GET    /api/v1/users/profile/me
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
```

### Materiais
```
GET    /api/v1/materials
GET    /api/v1/materials/:id
GET    /api/v1/materials/search?q=query
GET    /api/v1/materials/category/:category
POST   /api/v1/materials
PATCH  /api/v1/materials/:id
DELETE /api/v1/materials/:id
```

### Sistema
```
GET /api/v1/health
GET /api/v1/info
```

## 📊 Formato de Resposta

Todas as respostas seguem o formato padronizado:

```json
{
  "success": true,
  "message": "Operação realizada com sucesso",
  "data": {
    // dados da resposta
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### Exemplo de Resposta de Erro

```json
{
  "success": false,
  "message": "Erro na operação",
  "error": "Detalhes do erro",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## 🔐 Autenticação

### Registro de Usuário

```json
POST /api/v1/auth/register
{
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "name": "Nome do Usuário"
}
```

### Login

```json
POST /api/v1/auth/login
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

### Resposta de Login

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "access_token": "jwt-token-aqui",
    "user": {
      "id": "user-uuid",
      "email": "usuario@exemplo.com",
      "name": "Nome do Usuário",
      "avatar_url": null
    }
  }
}
```

## 📱 Funcionalidades Específicas para Mobile

### Health Check com Informações do Dispositivo

```http
GET /api/v1/health
Headers:
  X-Device-ID: device-123
  X-App-Version: 1.0.0
  X-Platform: android
```

Resposta:
```json
{
  "success": true,
  "message": "Sistema funcionando normalmente",
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 3600,
    "environment": "production",
    "version": "1.0.0",
    "mobileInfo": {
      "platform": "android",
      "appVersion": "1.0.0",
      "deviceId": "device-123"
    }
  }
}
```

## 🚀 V2 - Funcionalidades Avançadas

### Upload de Arquivos
```http
POST /api/v1/materials/upload
Content-Type: multipart/form-data

file: [arquivo PDF]
title: "Material de Estudo"
category: "Direito Constitucional"
```

### Notificações Push
```http
POST /api/v1/notifications/register
{
  "deviceToken": "fcm-token-aqui",
  "platform": "android",
  "userId": "user-uuid"
}
```

### Sincronização Offline
```http
POST /api/v1/sync/upload
{
  "offlineData": [
    // dados salvos offline
  ],
  "lastSync": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Configuração de Desenvolvimento

### URLs de Desenvolvimento

Para desenvolvimento local, use:

- **Android Emulator**: `http://10.0.2.2:3000`
- **iOS Simulator**: `http://localhost:3000`
- **Dispositivo físico**: `http://IP-DO-SEU-PC:3000`

### Configuração de CORS

O CORS está configurado para aceitar:

- `capacitor://localhost` (Ionic/Capacitor)
- `ionic://localhost` (Ionic)
- `http://localhost` (desenvolvimento local)

## 📊 Monitoramento

### Logs de Requisições Móveis

O sistema registra automaticamente:

- Device ID
- Versão do app
- Plataforma (Android/iOS)
- Tempo de resposta
- Endpoint acessado

### Exemplo de Log

```
📱 Mobile Request: GET /api/v1/materials | Device: device-123 | App Version: 1.0.0
📱 Mobile Response: GET /api/v1/materials | Time: 150ms | Device: device-123
```

## 🛠️ Implementação em Apps Móveis

### React Native

```javascript
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const API_BASE_URL = 'https://api.seudominio.com/api/v1';

const apiClient = {
  async request(endpoint, options = {}) {
    const deviceId = await DeviceInfo.getUniqueId();
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-ID': deviceId,
      'X-App-Version': '1.0.0',
      'X-Platform': Platform.OS,
      'X-Build-Number': '1',
      ...options.headers,
    };

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    return response.json();
  },
};
```

### Flutter

```dart
import 'package:device_info_plus/device_info_plus.dart';

class ApiClient {
  static const String baseUrl = 'https://api.seudominio.com/api/v1';
  
  static Future<Map<String, String>> getHeaders({String? token}) async {
    final deviceInfo = DeviceInfoPlugin();
    String deviceId = '';
    
    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      deviceId = androidInfo.id;
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      deviceId = iosInfo.identifierForVendor ?? '';
    }
    
    final headers = {
      'Content-Type': 'application/json',
      'X-Device-ID': deviceId,
      'X-App-Version': '1.0.0',
      'X-Platform': Platform.isAndroid ? 'android' : 'ios',
      'X-Build-Number': '1',
    };
    
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    
    return headers;
  }
}
```

### Ionic/Capacitor

```typescript
import { Capacitor } from '@capacitor/core';

const API_BASE_URL = 'https://api.seudominio.com/api/v1';

export class ApiService {
  private static async getHeaders(token?: string): Promise<Headers> {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Device-ID': await this.getDeviceId(),
      'X-App-Version': '1.0.0',
      'X-Platform': Capacitor.getPlatform(),
      'X-Build-Number': '1',
    });

    if (token) {
      headers.append('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private static async getDeviceId(): Promise<string> {
    // Implementar lógica para obter device ID
    return 'device-id';
  }
}
```

## 📞 Suporte

Para dúvidas sobre integração com apps móveis:

- 📧 Email: suporte@seudominio.com
- 📱 WhatsApp: (11) 99999-9999
- 🐛 Issues: GitHub Issues

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2024  
**Próxima versão**: V2 com funcionalidades avançadas 