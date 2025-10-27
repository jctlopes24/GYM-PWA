# 🏋️‍♂️ Gym Platform Backend

Uma plataforma completa para gestão de treinos entre personal trainers e clientes, construída com Node.js, Express e MongoDB.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Sistema de Autenticação Completo**
  - Registo de utilizadores (clientes e personal trainers)
  - Login com username/password
  - Login por QR Code
  - JWT tokens com refresh
  - Rate limiting para segurança
  - Bloqueio de conta após tentativas falhadas

- **Gestão de Utilizadores**
  - Perfis completos com validação
  - Diferentes roles: cliente, personal trainer, admin
  - Sistema de aprovação de personal trainers
  - Atribuição de clientes a personal trainers
  - Pedidos de mudança de personal trainer (aprovados por admin)

- **Sistema de Planos de Treino Completo**
  - Criação de planos personalizados por personal trainers
  - Suporte para 3x, 4x ou 5x por semana
  - Máximo 10 exercícios por sessão
  - Instruções e links de vídeo para exercícios
  - Filtros e ordenação por dia e cliente
  - Sistema de templates reutilizáveis
  - Acompanhamento de progresso e estatísticas

- **Gestão de Exercícios**
  - Base de dados de exercícios
  - Categorização por grupos musculares
  - Diferentes níveis de dificuldade
  - Instruções detalhadas e vídeos
  - Filtros por equipamento e especialização

- **Sistema de Logs de Treino**
  - Registro detalhado de treinos realizados
  - Acompanhamento de séries, repetições e pesos
  - Avaliação de dificuldade, energia e humor
  - Histórico completo de treinos
  - Estatísticas de progresso

- **Segurança e Validação**
  - Validação robusta de dados
  - Middleware de autenticação e autorização
  - Rate limiting
  - Helmet para segurança HTTP
  - CORS configurado
  - Tratamento global de erros

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- MongoDB (local ou Atlas)
- npm ou yarn

## 🛠️ Instalação

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd backend_gym
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   
   Crie um ficheiro `.env` na raiz do projeto com as seguintes variáveis:
   
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/gym_platform
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
   JWT_EXPIRE=7d
   
   # Server
   PORT=3000
   NODE_ENV=development
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3001
   ```

4. **Inicie o MongoDB**
   
   Certifique-se de que o MongoDB está a correr localmente ou configure a string de conexão para o MongoDB Atlas.

5. **Execute o servidor**
   
   Para desenvolvimento:
   ```bash
   npm run dev
   ```
   
   Para produção:
   ```bash
   npm start
   ```

## 📚 API Endpoints

### Autenticação (`/api/auth`)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/register` | Registo de utilizador | ❌ |
| POST | `/login` | Login com credenciais | ❌ |
| POST | `/login/qr` | Login por QR Code | ❌ |
| GET | `/verify` | Verificar token | ✅ |
| POST | `/logout` | Logout | ✅ |
| POST | `/refresh` | Renovar token | ✅ |
| POST | `/qr/generate` | Gerar QR Code | ✅ |

### Utilizadores (`/api/users`)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/profile` | Obter perfil atual | ✅ |
| PUT | `/profile` | Atualizar perfil | ✅ |
| PUT | `/profile/trainer` | Atualizar dados de trainer | ✅ |
| GET | `/` | Listar utilizadores | ✅ |
| GET | `/trainers` | Listar personal trainers | ✅ |
| GET | `/:id` | Obter utilizador por ID | ✅ |
| GET | `/trainer/clients` | Clientes do trainer atual | ✅ |
| POST | `/trainer/assign-client` | Atribuir cliente | ✅ |
| POST | `/client/request-trainer-change` | Solicitar mudança de trainer | ✅ |
| PUT | `/trainer/:id/approve` | Aprovar trainer (admin) | ✅ |
| GET | `/admin/trainer-change-requests` | Pedidos de mudança (admin) | ✅ |
| PUT | `/admin/trainer-change/:clientId` | Processar pedido (admin) | ✅ |
| PUT | `/admin/user/:id/toggle-status` | Ativar/desativar utilizador (admin) | ✅ |

### Planos de Treino - Personal Trainers (`/api/workouts`)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/plans` | Criar plano de treino | ✅ |
| GET | `/plans` | Listar planos do trainer | ✅ |
| GET | `/plans/:id` | Obter plano específico | ✅ |
| PUT | `/plans/:id` | Atualizar plano de treino | ✅ |
| PUT | `/plans/:id/toggle` | Ativar/desativar plano | ✅ |
| GET | `/exercises` | Listar exercícios disponíveis | ✅ |
| POST | `/exercises` | Criar novo exercício | ✅ |
| GET | `/stats` | Estatísticas dos planos | ✅ |

### Planos de Treino - Clientes (`/api/client/workouts`)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/plans` | Listar planos do cliente | ✅ |
| GET | `/plans/:id` | Obter plano específico | ✅ |
| GET | `/today` | Obter treino do dia | ✅ |
| POST | `/logs` | Registrar conclusão de treino | ✅ |
| GET | `/logs` | Histórico de treinos | ✅ |
| GET | `/stats` | Estatísticas do cliente | ✅ |

## 🔐 Roles e Permissões

### Cliente (`client`)
- Ver e editar próprio perfil
- Solicitar mudança de personal trainer
- Ver dados do personal trainer atribuído

### Personal Trainer (`trainer`)
- Ver e editar próprio perfil
- Ver lista de clientes atribuídos
- Atribuir clientes (se aprovado)
- Ver dados dos clientes atribuídos

### Administrador (`admin`)
- Todas as permissões anteriores
- Aprovar/rejeitar personal trainers
- Processar pedidos de mudança de trainer
- Ativar/desativar utilizadores
- Ver todos os utilizadores

## 📊 Estrutura do Projeto

```
backend_gym/
├── config/
│   └── db.js                 # Configuração da base de dados
├── controllers/
│   ├── authController.js     # Controlador de autenticação
│   └── userController.js     # Controlador de utilizadores
├── middleware/
│   ├── auth.js              # Middleware de autenticação
│   └── validation.js        # Middleware de validação
├── models/
│   └── User.js             # Modelo de utilizador
├── routes/
│   ├── auth.js             # Rotas de autenticação
│   └── users.js            # Rotas de utilizadores
├── index.js                 # Ficheiro principal
├── package.json             # Dependências e scripts
└── README.md               # Este ficheiro
```

## 🧪 Testando a API

### 1. Registo de Cliente
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "cliente1",
    "email": "cliente1@example.com",
    "password": "Password123",
    "firstName": "João",
    "lastName": "Silva",
    "phone": "912345678",
    "role": "client"
  }'
```

### 2. Registo de Personal Trainer
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "trainer1",
    "email": "trainer1@example.com",
    "password": "Password123",
    "firstName": "Maria",
    "lastName": "Santos",
    "phone": "987654321",
    "role": "trainer",
    "specialization": ["Musculação", "Cardio"],
    "experience": 5,
    "bio": "Personal trainer com 5 anos de experiência"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "cliente1",
    "password": "Password123"
  }'
```

### 4. Obter Perfil (com token)
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Criar Plano de Treino (Personal Trainer)
```bash
curl -X POST http://localhost:3000/api/workouts/plans \
  -H "Authorization: Bearer TRAINER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Plano Iniciante - Musculação",
    "description": "Plano para iniciantes em musculação",
    "clientId": "CLIENT_ID",
    "frequency": "3x",
    "sessions": [
      {
        "dayOfWeek": "monday",
        "exercises": [
          {
            "exercise": "EXERCISE_ID",
            "sets": 3,
            "reps": "8-12",
            "weight": "peso corporal",
            "restTime": "60 segundos",
            "order": 1
          }
        ],
        "sessionNotes": "Foco na técnica",
        "estimatedDuration": 45
      }
    ],
    "startDate": "2024-01-01",
    "goals": ["ganho_massa", "força"],
    "level": "iniciante",
    "totalWeeks": 4
  }'
```

### 6. Obter Treino do Dia (Cliente)
```bash
curl -X GET http://localhost:3000/api/client/workouts/today \
  -H "Authorization: Bearer CLIENT_JWT_TOKEN"
```

### 7. Registrar Conclusão de Treino (Cliente)
```bash
curl -X POST http://localhost:3000/api/client/workouts/logs \
  -H "Authorization: Bearer CLIENT_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workoutPlanId": "PLAN_ID",
    "sessionId": "SESSION_ID",
    "week": 1,
    "dayOfWeek": "monday",
    "actualDuration": 50,
    "exercises": [
      {
        "exercise": "EXERCISE_ID",
        "sets": [
          {
            "setNumber": 1,
            "reps": 10,
            "weight": "peso corporal",
            "completed": true
          }
        ]
      }
    ],
    "difficulty": "médio",
    "energy": "alta",
    "mood": "bom"
  }'
```

## 🔧 Scripts Disponíveis

- `npm start` - Inicia o servidor em modo produção
- `npm run dev` - Inicia o servidor em modo desenvolvimento com nodemon
- `npm test` - Executa testes (a implementar)

## 🚀 Próximos Passos

### Funcionalidades a Implementar
- [ ] Sistema de planos de treino
- [ ] Acompanhamento de progresso
- [ ] Sistema de notificações
- [ ] Upload de imagens de perfil
- [ ] Sistema de mensagens
- [ ] Relatórios e estatísticas
- [ ] Sistema de pagamentos
- [ ] API de integração com dispositivos fitness

### Melhorias Técnicas
- [ ] Testes unitários e de integração
- [ ] Documentação da API com Swagger
- [ ] Cache com Redis
- [ ] Logs estruturados
- [ ] Monitorização e métricas
- [ ] CI/CD pipeline

## 🐛 Resolução de Problemas

### Erro de Conexão com MongoDB
- Verifique se o MongoDB está a correr
- Confirme a string de conexão no `.env`
- Verifique as permissões de acesso

### Erro de Token JWT
- Verifique se `JWT_SECRET` está definido
- Confirme se o token não expirou
- Verifique o formato do header Authorization

### Erro de Validação
- Verifique se todos os campos obrigatórios estão preenchidos
- Confirme os formatos de email e telefone
- Verifique os limites de caracteres

## 📞 Suporte

Para questões ou problemas, consulte a documentação ou contacte a equipa de desenvolvimento.

---

**Desenvolvido com ❤️ para a gestão eficiente de treinos**
