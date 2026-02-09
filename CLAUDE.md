# BlaBlaBla — Projeto de Streaming Sincronizado

## Visão do Produto
App que permite múltiplas pessoas ouvirem a mesma música **ao mesmo tempo** em dispositivos diferentes, sem precisar dividir fones. Caso de uso principal: academia (ele e a esposa ouvem a mesma playlist em AirPods separados). Também funciona para festas a distância.

## Como Funciona
1. Usuário faz login (Google / Facebook / Apple via Firebase)
2. Cria ou entra numa **sala** usando um código de 6 caracteres
3. O **host** da sala busca músicas no YouTube e controla o playback (play, pause, seek)
4. Todos os membros recebem o estado do playback sincronizado via WebSocket + NTP
5. Cada dispositivo toca o mesmo vídeo YouTube sincronizado

> Spotify: integração pausada (credenciais em hold no Spotify Developer). YouTube usado como fonte principal enquanto isso.

---

## Stack Tecnológica
| Camada | Tecnologia |
|---|---|
| Frontend | HTML + CSS + JS vanilla (sem framework) |
| Backend | Node.js + Express |
| Real-time | Socket.IO |
| Banco de dados | MongoDB (Mongoose) |
| Autenticação | Firebase Auth (Google, Facebook, Apple) |
| Música (atual) | YouTube IFrame Player + YouTube Data API v3 |
| Música (futuro) | Spotify Web Playback SDK (quando credenciais liberarem) |
| Sincronização | NTP (pool.ntp.org) para timestamp preciso |

---

## Estrutura do Projeto
```
blablabla/
├── index.html                  # Landing page (completa, com i18n PT/EN/ES)
├── app.html                    # App principal (login, salas, player YouTube, busca)
├── backend/
│   ├── .env                    # Variáveis de ambiente (não commitar)
│   ├── .env.example            # Template das variáveis necessárias
│   ├── package.json
│   └── src/
│       ├── index.js            # Entry point: Express + Socket.IO + NTP + serve estático
│       ├── config/
│       │   ├── db.js           # Conexão MongoDB
│       │   └── firebase.js     # Init Firebase Admin SDK
│       ├── middleware/
│       │   └── authMiddleware.js   # Verifica token Firebase (Bearer)
│       ├── models/
│       │   ├── User.js         # Schema: firebaseUid, email, spotify tokens
│       │   └── Room.js         # Schema: code, host, members, playbackState
│       ├── routes/
│       │   ├── users.js        # GET /me, POST /spotify/connect, GET /spotify/token
│       │   ├── rooms.js        # POST /, GET /:code, POST /:code/join|leave
│       │   └── youtube.js      # GET /search — proxy para YouTube Data API v3
│       ├── services/
│       │   ├── roomUtils.js    # generateRoomCode() — 6 chars alfanuméricos
│       │   └── spotifyService.js   # refreshSpotifyToken()
│       └── sockets/
│           └── roomSockets.js  # WebSocket events + emite ntpOffset após auth
└── .claude/
    ├── settings.json
    └── settings.local.json
```

---

## API REST (todas protegidas por Firebase token)
| Método | Endpoint | Função |
|---|---|---|
| GET | /api/users/me | Retorna/cria perfil do usuário |
| POST | /api/users/spotify/connect | Salva tokens Spotify após OAuth |
| GET | /api/users/spotify/token | Retorna token válido (auto-refresh) |
| POST | /api/rooms | Cria sala (caller = host) |
| GET | /api/rooms/:code | Busca sala pelo código |
| POST | /api/rooms/:code/join | Entra na sala |
| POST | /api/rooms/:code/leave | Sai da sala |
| GET | /api/youtube/search?q=... | Busca vídeos no YouTube (proxy) |

## Eventos WebSocket
**Cliente → Servidor:**
- `authenticate` → verifica token Firebase
- `join_room` / `leave_room` → entrar/sair sala
- `play` / `pause` / `resume` / `seek` → controle de playback (host only)

**Servidor → Cliente:**
- `authenticated` (uid, ntpOffset) / `error`
- `room_state` → estado completo ao entrar
- `member_joined` / `member_left` / `host_changed`
- `playback_update` → sincroniza estado do playback para todos

---

## O que já está pronto
- [x] Landing page com design completo (dark theme, animações, i18n)
- [x] Backend Express com todas as rotas REST + YouTube search proxy
- [x] Firebase Auth middleware (backend) + login com popup (frontend)
- [x] Modelos MongoDB (User, Room) com TTL de 24h para salas inativas
- [x] Socket.IO com sincronização NTP (offset enviado ao cliente após auth)
- [x] Lógica de host (controle de playback) e promoção automática
- [x] **app.html** — frontend completo:
  - Login (Google / Facebook / Apple via Firebase popup)
  - Criar sala / entrar sala por código
  - YouTube IFrame Player sincronizado via NTP
  - Busca de músicas (texto ou link YouTube)
  - Controles play/pause/seek (host only)
  - Volume local (para todos)
  - Lista de membros com indicação de host
- [x] Express serve arquivos estáticos (index.html e app.html) na porta 3000

## O que ainda falta fazer
- [ ] Adicionar link para app.html na landing page (index.html)
- [ ] Integração Spotify (quando credenciais liberarem no Spotify Developer)
- [ ] UI de perfil e configurações
- [ ] Chat/mensagens entre membros da sala (opcional)
- [ ] Build para mobile (iOS / Android)
- [ ] Testes e refinamentos de UX

---

## Variáveis de Ambiente (backend/.env)
- `PORT` — porta do servidor (default 3000)
- `MONGODB_URI` — connection string do MongoDB
- `CLIENT_ORIGIN` — URL do frontend (CORS)
- `FIREBASE_PROJECT_ID` / `FIREBASE_PRIVATE_KEY` / `FIREBASE_CLIENT_EMAIL`
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` (vazio — integração em hold)
- `YOUTUBE_API_KEY` — chave da YouTube Data API v3

## Comandos
```bash
cd backend
npm install     # instalar dependências
npm run dev     # rodar com nodemon (desenvolvimento)
npm start       # rodar em produção
```
