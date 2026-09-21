# Linkipax — Backend Architecture Deep Dive

> **Live App:** https://linlifys.vercel.app
> **Stack:** Node.js · Express · MongoDB · Socket.IO · GraphQL · Cloudinary · JWT · WebRTC

---

## Table of Contents

| # | Section |
|---|---|
| 1 | [What is Linkipax?](#1-what-is-linkipax) |
| 2 | [Full Tech Stack](#2-full-tech-stack) |
| 3 | [High-Level Architecture HLD](#3-high-level-architecture-hld) |
| 4 | [Server Boot Sequence LLD](#4-server-boot-sequence-lld) |
| 5 | [Folder and File Map](#5-folder-and-file-map) |
| 6 | [Every JS File Explained](#6-every-js-file-explained) |
| 7 | [All Database Models and ER Diagram](#7-all-database-models-and-er-diagram) |
| 8 | [Complete FK Relationships Table](#8-complete-fk-relationships-table) |
| 9 | [Pre-save Hooks and TTL Auto-Delete](#9-pre-save-hooks-and-ttl-auto-delete) |
| 10 | [GraphQL Deep Dive](#10-graphql-deep-dive) |
| 11 | [Middleware Every Layer Explained](#11-middleware-every-layer-explained) |
| 12 | [Real-Time System Socket.IO and WebRTC](#12-real-time-system-socketio-and-webrtc) |
| 13 | [Authentication JWT and Google OAuth](#13-authentication-jwt-and-google-oauth) |
| 14 | [File Uploads Cloudinary Pipeline](#14-file-uploads-cloudinary-pipeline) |
| 15 | [Web Push Notifications VAPID](#15-web-push-notifications-vapid) |
| 16 | [Complete API Route Reference](#16-complete-api-route-reference) |
| 17 | [Environment Variables](#17-environment-variables) |
| 18 | [Running Locally](#18-running-locally) |
| 19 | [Complete Database Key Theory + Full ER Analysis](#19-complete-database-key-theory--full-er-analysis) |
---

## 1. What is Linkipax?

Linkipax is a **LinkedIn-inspired professional social network** — think LinkedIn + WhatsApp + TikTok + Zoom + AI Resume analyser, all in one platform.

| Feature | Description |
|---|---|
| User Accounts | Register / Login / Google OAuth, full profile with bio, job title, skills |
| News Feed | Create posts (text, image, video, poll, repost), like, bookmark, comment |
| Direct Messaging | Real-time 1-on-1 chat: text, audio, image, video, documents, live location, polls |
| Video Calls | WebRTC peer-to-peer rooms with screen share, mic/cam control |
| Notifications | In-app + browser Web Push (VAPID) notifications |
| Connections | LinkedIn-style send / accept / reject connection requests |
| Groups | Group chat with multiple members |
| Events | Create events, upvote/downvote, trending events |
| Hackathons | Organise hackathons with teams, prizes, schedule, sponsors |
| Jobs Board | Post and browse job listings |
| Shorts | Upload TikTok-style short videos |
| Stories / Status | 24-hour disappearing stories with stickers, music, filters |
| Resume AI | Upload PDF resume → Python AI analyses it → ATS score + skill match |
| Skills | Add skills with proficiency levels 1-5 |
| Post Analytics | Track impressions, engagement, device, referrer, geo |
| Visitor Tracking | Count unique site visitors by IP and device |

---

## 2. Full Tech Stack

```
Language         Node.js v18+
Framework        Express.js v4
Database         MongoDB via Mongoose v8 ODM
Real-Time        Socket.IO v4 (WebSocket + polling fallback)
GraphQL          Apollo Server Express v3 + graphql v16
Auth             jsonwebtoken + Passport.js (Google OAuth2)
File Uploads     Multer + multer-storage-cloudinary + Cloudinary SDK
Push Notifs      web-push (VAPID protocol)
AI               OpenAI API + Google Generative AI (Gemini)
Resume AI        Python script analyze_resume.py via child_process
Logging          Winston v3 (console + 3 rotating log files)
Security         helmet + express-rate-limit + bcryptjs + crypto
Sessions         express-session
Container        Docker + docker-compose
```

---

## 3. High-Level Architecture HLD

```
+-----------------------------------------------+
|         CLIENT  (React + Vite)                |
|         https://linlifys.vercel.app           |
+-------------------+---------------------------+
                    |  HTTPS + WSS (WebSocket)
                    |
+-------------------v---------------------------+
|           server.js  (Entry Point)            |
|                                               |
|  [CORS] [Helmet] [Morgan] [Session/Passport]  |
|                                               |
|  +------------------------------------------+|
|  |  29 REST Route Modules                   ||
|  |  /user  /api/posts  /connections         ||
|  |  /api/notifications  /api/groups         ||
|  |  /jobs  /api/events  /api/short  ...     ||
|  +------------------------------------------+|
|                                               |
|  +---------------------+ +------------------+|
|  |  Apollo GraphQL     | |   Socket.IO      ||
|  |  Endpoint /graphql  | |   Real-Time      ||
|  +---------------------+ +------------------+|
|                                               |
|  [JWT Auth Middleware] [Multer Upload]        |
+-------+---------------+-----------+----------+
        |               |           |
+-------v---+   +-------v--+  +----v-----------+
|  MongoDB  |   | Cloudnry |  | External APIs  |
| 22 Models |   | Images   |  | OpenAI, Gemini |
| Mongoose  |   | Videos   |  | Google Trends  |
|           |   | Docs     |  | NewsAPI, OAuth |
+-----------+   +----------+  +----------------+
```

### Why This Architecture?

| Choice | Reason |
|---|---|
| Express REST | Simple fast routing for CRUD operations |
| Socket.IO | Real-time message delivery and WebRTC signaling without polling |
| Apollo GraphQL | Flexible querying for chat history — client picks exact fields |
| MongoDB | Flexible schema suits a social network where feature fields evolve |
| Cloudinary | CDN + auto-transforms for images/videos without own storage server |
| web-push VAPID | Browser push notifications even when the app tab is closed |

---

## 4. Server Boot Sequence LLD

When you run `npm start`, `server.js` boots in this exact order:

```
npm start -> node server.js
|
+-- Step 1: require('dotenv').config()
|           Load .env -> process.env.MONGODB_URI, JWT_SECRET_KEY, etc.
|
+-- Step 2: const app = express()
|           const server = http.createServer(app)
|           http.Server wraps Express so Socket.IO shares the same port
|
+-- Step 3: GLOBAL MIDDLEWARE (runs for EVERY request, in order)
|   |
|   +-- cors({ origin: FRONTEND_ORIGIN, credentials: true })
|   |    Allow Vercel frontend to send cookies cross-origin
|   |
|   +-- app.set('trust proxy', 1)
|   |    Trust X-Forwarded-Proto from Render/Railway reverse proxy
|   |    Needed so req.secure = true and secure cookies work
|   |
|   +-- session({ secret, resave:false, cookie:{ secure, sameSite:'none' } })
|   |    Server-side session storage needed by Passport for Google OAuth
|   |
|   +-- express.json()
|   |    Parse JSON body -> req.body = { ... }
|   |
|   +-- helmet({ crossOriginResourcePolicy: 'cross-origin' })
|   |    Set 15+ security headers: XSS, clickjacking, MIME sniff, CSP
|   |
|   +-- morgan('tiny')
|   |    Log every request: "POST /api/posts 201 45ms"
|   |
|   +-- cookieParser()
|   |    Parse Cookie header -> req.cookies = { auth_token: 'eyJ...' }
|   |
|   +-- passport.initialize() + passport.session()
|        Restore OAuth user from session on each request
|
+-- Step 4: STATIC FILES
|   +-- GET /music/*    -> server/public/music/
|   +-- GET /stickers/* -> server/public/stickers/
|   +-- GET /uploads/*  -> server/uploads/
|
+-- Step 5: connectDB()
|           mongoose.connect(MONGODB_URI)
|           Failure -> process.exit(1)
|
+-- Step 6: initializeSocket(server)    from socket/socketnadle.js
|           app.set('io', getIO())      store instance for routes
|
+-- Step 7: Apollo GraphQL
|           apolloServer.start()
|           apolloServer.applyMiddleware({ app, cors: false })
|           Mounts at GET/POST /graphql
|
+-- Step 8: 29 REST route modules registered
|
+-- Step 9: 404 handler + global error handler
|
+-- Step 10: SIGINT graceful shutdown
|            server.close() -> mongoose.connection.close() -> process.exit(0)
|
+-- Step 11: server.listen(PORT, '0.0.0.0')
             "Server running at port 5001"
```

---

## 5. Folder and File Map

```
Linkify/
+-- server/
|   +-- server.js                   Entry point: boots everything
|   +-- cloudinary.js               Cloudinary SDK config + upload helpers
|   +-- config.js                   Reads and exports all env variables
|   +-- analyze_resume.py           Python AI resume analyser
|   +-- package.json                Dependencies
|   +-- Dockerfile
|   +-- docker-compose.yml
|   |
|   +-- GraphQL/
|   |   +-- messageschema.js        typeDefs + resolvers (the real GraphQL file)
|   |   +-- Appoloserver.js         Reference snippet (not imported anywhere)
|   |   +-- Mutate.js               Frontend @apollo/client usage example
|   |
|   +-- socket/
|   |   +-- socketnadle.js          ALL Socket.IO event handlers
|   |
|   +-- middleware/
|   |   +-- middleware.js           JWT auth via cookie
|   |   +-- Authentication.js       JWT auth via Authorization header
|   |   +-- auth.js                 Simple auth via X-User-ID header
|   |   +-- multer.js               Local disk upload for short videos
|   |
|   +-- service/
|   |   +-- authentication1.js      JWT create / validate / refresh
|   |   +-- webPushService.js       Web Push VAPID send functions
|   |
|   +-- utils/
|   |   +-- logger.js               Winston structured logger
|   |   +-- apiFeatures.js          APIFeatures class filter/sort/paginate
|   |   +-- appError.js             Custom AppError(message, statusCode)
|   |   +-- catchAsync.js           Wrap async handlers, auto-forward errors
|   |   +-- idGenerators.js         Unique ID utilities
|   |
|   +-- config/
|   |   +-- openaiConfig.js         OpenAI client initialisation
|   |
|   +-- controller/
|   |   +-- controller.js
|   |   +-- educationController.js
|   |   +-- eduuserDetailController.js
|   |   +-- experienceController.js
|   |   +-- externalApis.js         Google Trends + NewsAPI calls
|   |   +-- hackathonController.js
|   |   +-- openaicontroller.js     AI suggestion generation
|   |   +-- roomController.js       Video room create/join
|   |   +-- shortController.js      Short video upload + Cloudinary
|   |   +-- userDetailController.js
|   |   +-- userDetailsController.js
|   |
|   +-- routes/                     29 Express Router files
|   |   +-- userroutes.js           /user
|   |   +-- Postroutes.js           /api/posts
|   |   +-- messageroute.js         / (DM chat)
|   |   +-- notificationroute.js    /api/notifications
|   |   +-- connectionroute.js      /connections
|   |   +-- grouproute.js           /api/groups
|   |   +-- Eventroute.js           /api/events
|   |   +-- hackathonRoutes.js      /api/hackathons
|   |   +-- skillroute.js           /skill
|   |   +-- educationRoutes.js      /education
|   |   +-- experienceRoutes.js     /experience
|   |   +-- statusroutes.js         / (stories)
|   |   +-- statusedit.js           /api/status
|   |   +-- shortRoutes.js          /api/short
|   |   +-- Resumeroute.js          /upload
|   |   +-- roomRoute.js            /api/room
|   |   +-- searchroutes.js         /search
|   |   +-- Jobsroutes.js           /jobs
|   |   +-- visitorRoutes.js        /visitor
|   |   +-- PostImpressionroutes.js /post-impression
|   |   +-- Profileviewroute.js     /profile-view
|   |   +-- suggestroute.js         /api/user/suggestions
|   |   +-- Trendingroute.js        /api/trending-topics
|   |   +-- Commentroutes.js        /api/comments
|   |   +-- UsersRoutes.js          /api/users
|   |   +-- userDetails.js          /profile
|   |   +-- openaisuggestroutes.js  /openai
|   |   +-- externalapitrendingRoutes.js /external
|   |
|   +-- model/                      22 Mongoose schemas
|       +-- usermodel.js            User (central hub)
|       +-- Postmodel.js            Post
|       +-- Commentmodel.js         Comment on posts
|       +-- messagemodel.js         Direct Message
|       +-- notificationschema.js   Notification
|       +-- connectionmodel.js      Connection request
|       +-- roommodel.js            Video call room
|       +-- groupmodel.js           Group chat
|       +-- Eventmodel.js           Event listing
|       +-- Hackathonmodel.js       Hackathon
|       +-- skillmodel.js           User skills
|       +-- educationModel.js       Education history
|       +-- experiencemodel.js      Work experience
|       +-- adddatamodel.js         Extended profile (UserDetails)
|       +-- Resumemodel.js          AI-analysed resume
|       +-- Jobsmodel.js            Job listing
|       +-- shortmodel.js           Short video
|       +-- statuseditmodel.js      Story/Status 24h
|       +-- PostImpression.js       Post analytics
|       +-- Trendingmodel.js        Trending topic
|       +-- ProfileView.js          Profile view log
|       +-- voteevent.js            Event upvote/downvote
|       +-- commentevent.js         Comment on event
|       +-- suggestmodel.js         User suggestions shadow
|       +-- Stats.js                Site-wide visitor counter
|       +-- VisitorCount.js         Per-visitor tracking
|
+-- Linkipax/                       Frontend React + Vite
```

---

## 6. Every JS File Explained

### server.js — The Entry Point

The **single file that runs the entire backend**. Its responsibilities in order:

1. Load `.env` into `process.env`
2. Create Express app and HTTP server (wrapping Express so Socket.IO can share the port)
3. Register all global middleware in the correct order
4. Serve static assets (music, stickers, uploads)
5. Connect to MongoDB — exits if this fails
6. Initialize Socket.IO and store the `io` instance on the app with `app.set('io', getIO())`
7. Start Apollo GraphQL server and mount it at `/graphql`
8. Register all 29 REST route modules
9. Add 404 and global error handlers
10. Listen on PORT, handle graceful SIGINT shutdown

**Key pattern to understand:** `app.set('io', getIO())` stores the Socket.IO instance globally on the Express app object. Any route or controller can then do `const io = req.app.get('io')` to emit real-time events from inside a REST route.

---

### cloudinary.js — Media Upload Configuration

Configures the Cloudinary SDK once and exports multiple reusable upload utilities:

| Export | Type | Purpose |
|---|---|---|
| `cloudinary` | SDK instance | Direct Cloudinary API calls |
| `storage` | CloudinaryStorage | Multer storage engine for shorts/images — streams directly to Cloudinary |
| `profilePicStorage` | CloudinaryStorage | Same but auto-crops to 500x500 for avatars |
| `uploadProfilePic` | multer middleware | Ready-to-use: combines multer + profilePicStorage |
| `uploadImage(filePath)` | async function | Upload local file to `event_images` folder, delete local after |
| `deleteFromCloudinary(publicId)` | async function | Delete a video resource from Cloudinary |
| `deleteImage(publicId)` | async function | Delete an image resource from Cloudinary |
| `unlinkAsync` | promisified fn | fs.unlink as a Promise for clean async/await file cleanup |

Short video flow: multer saves locally → controller calls `cloudinary.uploader.upload()` → gets CDN URL → calls `unlinkAsync()`.

---

### GraphQL/messageschema.js — The Real GraphQL Module

The **only GraphQL file actually imported by server.js**. It exports:
- `typeDefs` — SDL string: defines `type Message`, `type Query`, `type Mutation`
- `resolvers` — JavaScript object with `Query.getMessages` and `Mutation.sendMessage`

### GraphQL/Appoloserver.js — Reference Snippet

A standalone code snippet showing how Apollo Server attaches to Express. NOT imported anywhere — the actual bootstrap lives in `server.js`. Useful reading for learning the pattern.

### GraphQL/Mutate.js — Frontend Usage Example

A React component demonstrating how the frontend uses `@apollo/client`. Shows `useQuery` for fetching message history and `useMutation` for sending a message. Study this to understand the full GraphQL request cycle.

---

### socket/socketnadle.js — Real-Time Engine

Contains every Socket.IO event handler. Exports:

| Export | Purpose |
|---|---|
| `initializeSocket(server)` | Creates io instance, registers all events |
| `getIO()` | Returns the global io instance (throws if called before init) |
| `users` | In-memory `{ userId: socketId }` map for online-user lookup |
| `getConnectedUsers()` | Returns the connected users Map |
| `isUserOnline(userId)` | Boolean check for online status |

The `users` object is the critical data structure: when user A wants to message user B, the server does `io.to(users[B.userId]).emit('new_message', ...)`. If B is not in the map, they are offline and a web push is sent instead.

---

### middleware/middleware.js — Cookie JWT Auth

```
Function: checkForAuthenticationCookie(cookieName, options)
Default cookieName: 'auth_token'
Options:  { strict: false }

Flow:
  1. token = req.cookies['auth_token']
  2. No token + strict=true  -> 401 Unauthorized
  3. No token + strict=false -> next() (anonymous access)
  4. jwt.verify(token, JWT_SECRET_KEY)
     - TokenExpiredError  -> 401 (or next() if not strict)
     - JsonWebTokenError  -> 401 always
  5. validateToken(token) -> { userId, email, username, ... }
  6. req.user = payload
  7. next()
```

### middleware/Authentication.js — Header JWT Auth

```
Function: checkForAuthenticationHeader()

Flow:
  1. req.headers['authorization'] -> "Bearer eyJ..."
  2. Split on ' ' -> extract token part
  3. jwt.verify(token, JWT_SECRET_KEY)
  4. Verify decoded.userId exists
  5. req.user = decoded
  6. next()
```

Used for Postman / mobile / server-to-server API access where cookies are not sent.

### middleware/auth.js — X-User-ID Header Auth

The simplest possible auth. No cryptography. Reads `X-User-ID` header, validates it is a 24-char hex MongoDB ObjectId, sets `req.user = { id: userId }`. Used for lightweight internal routes.

### middleware/multer.js — Local Disk Upload

```
For SHORT VIDEOS only:
  Storage:        tmp/uploads/ (auto-created if missing)
  Filename:       short-{timestamp}-{random}.{ext}
  Allowed types:  video/mp4, video/quicktime, video/x-msvideo
  Max size:       60 MB

Exports:
  uploadToLocal      -> multer middleware
  handleUploadErrors -> error middleware for size/type rejections
```

---

### service/authentication1.js — JWT Operations

Single source of truth for all JWT work:

| Function | Input | Output | Notes |
|---|---|---|---|
| `createTokenuser(user)` | user doc | JWT string | Payload: userId, email, username, name, profilePicture. Expires: 7 days |
| `validateToken(token)` | JWT | payload | Throws on expired or invalid |
| `verifyToken(req,res,next)` | middleware | sets req.user | Reads header OR cookie OR query param |
| `generateGoogleAuthToken(user)` | user doc | JWT string | Adds authMethod:'google'. Expires: 30 days |
| `generateRegularToken(user)` | user doc | JWT string | Adds authMethod:'regular'. Expires: 7 days |
| `isTokenExpiringSoon(token)` | JWT | boolean | True if expires within 15 minutes |
| `refreshToken(oldToken)` | JWT | new JWT | Same payload, fresh expiry |

### service/webPushService.js — Browser Push Notifications

| Function | Purpose |
|---|---|
| `initializeWebPush()` | Reads VAPID keys from .env, calls webpush.setVapidDetails() |
| `normalizePayload(payload)` | Ensures {title, body, icon, badge, tag, url, data} structure |
| `sendWebPushNotification(subscription, payload)` | Sends push, handles 410/404/429 error codes |
| `sendWebPushToUser(userId, payload)` | Finds user's pushSubscription in DB, calls above |

Auto-cleans expired subscriptions from the database on 410 Gone errors.

---

### utils/logger.js — Winston Logger

Four transports writing simultaneously:

| Transport | File | Level |
|---|---|---|
| Console | stdout | All (colorised) |
| File | logs/error.log | error only |
| File | logs/combined.log | all levels |
| File | logs/http.log | http (Morgan) |

Also exposes `logger.notification.created()`, `.read()`, `.error()`, `.socket()` for structured notification events. Handles `uncaughtException` and `unhandledRejection` globally.

### utils/apiFeatures.js — Query Builder

```javascript
const features = new APIFeatures(Post.find(), req.query)
  .filter()       // ?price[gte]=100  =>  { price: { $gte: 100 } }
  .sort()         // ?sort=-createdAt,likes
  .limitFields()  // ?fields=title,content
  .paginate();    // ?page=2&limit=10  =>  skip(10).limit(10)
const results = await features.query;
```

### utils/appError.js — Custom Error

```javascript
class AppError extends Error {
  constructor(message, statusCode) { ... }
}
throw new AppError('User not found', 404);
// Global error handler in server.js catches it and sends { status:'fail', message }
```

### utils/catchAsync.js — Async Wrapper

```javascript
const catchAsync = fn => (req, res, next) => fn(req,res,next).catch(next);
router.get('/posts', catchAsync(async (req, res) => {
  // Any thrown error auto-forwarded to Express global error handler
}));
```

---

### Controllers (controller/)

| File | What it controls |
|---|---|
| controller.js | Shared utility functions |
| educationController.js | CRUD for Education + validation |
| eduuserDetailController.js | Fetch user + education in one call |
| experienceController.js | CRUD for Experience entries |
| externalApis.js | Calls Google Trends API + NewsAPI, returns formatted results |
| hackathonController.js | Create hackathon, register participant, update status |
| openaicontroller.js | Build prompt -> call OpenAI -> return AI suggestions |
| roomController.js | Create video room with ICE servers, get room details |
| shortController.js | Upload video -> Cloudinary -> save Short doc |
| userDetailController.js | Update profile, change password, get connections |
| userDetailsController.js | Extended profile: background image, social links |

---

### Routes (routes/)

Each file creates an Express Router, applies middleware, and delegates to controllers:

| File | Mount | Key operations |
|---|---|---|
| userroutes.js | /user | Register, login, logout, Google OAuth, profile CRUD, password reset |
| Postroutes.js | /api/posts | Create/read/update/delete posts, likes, bookmarks, reposts, poll votes |
| messageroute.js | / | Get conversation, REST send message, delete, reactions |
| notificationroute.js | /api/notifications | List, mark read, mark all, delete, push subscribe |
| connectionroute.js | /connections | Send, accept, reject, list, pending requests |
| grouproute.js | /api/groups | Create group, add/remove members, group messages |
| Eventroute.js | /api/events | Create, list, vote, comment, trending events |
| hackathonRoutes.js | /api/hackathons | Create, join, list hackathons |
| skillroute.js | /skill | Add, update, delete skills and proficiency levels |
| educationRoutes.js | /education | Add, update, delete education |
| experienceRoutes.js | /experience | Add, update, delete experience |
| statusroutes.js | / | Create, view, delete 24h stories |
| shortRoutes.js | /api/short | Upload short video, like, dislike, comment |
| Resumeroute.js | /upload | Upload PDF, trigger Python AI analysis, save result |
| roomRoute.js | /api/room | Create video room, get ICE config |
| searchroutes.js | /search | Search users, posts, hackathons |
| Jobsroutes.js | /jobs | Post job, list, filter |
| visitorRoutes.js | /visitor | Log visitor, get stats |
| PostImpressionroutes.js | /post-impression | Track impressions, get analytics |
| Profileviewroute.js | /profile-view | Log view, who viewed me |
| suggestroute.js | /api/user/suggestions | AI + rule-based suggestions |
| Trendingroute.js | /api/trending-topics | Trending topics |
| Commentroutes.js | /api/comments | CRUD comments on posts |


---

## 7. All Database Models and ER Diagram

> Reading guide: `(-> ModelName)` = ObjectId FK to that model. `([-> ModelName])` = array of ObjectId FKs.

### USER MODEL (usermodel.js) — Central Hub

```
+=========================================================+
|                   USER                                  |
|  _id               ObjectId    PRIMARY KEY              |
|  username          String      UNIQUE, sparse           |
|  email             String      UNIQUE, required         |
|  password          String      bcrypt 12 rounds         |
|  googleId          String      UNIQUE, sparse           |
|  name              String      auto-capitalised         |
|  profilePicture    String      URL                      |
|  bio               String      max 500 chars            |
|  jobTitle          String      max 100 chars            |
|  company           String      max 100 chars            |
|  industry          String      max 100 chars            |
|  location          String      max 100 chars            |
|  website           String      URL-validated            |
|  skills            [String]    flat list                |
|  isOnline          Boolean     default false            |
|  lastSeen          Date        set by pre-save hook     |
|  isVerified        Boolean     true for Google users    |
|  profileCompleted  Boolean     auto-computed            |
|  pushSubscription  Object      VAPID sub object         |
|  pushEnabled       Boolean                              |
|  pendingRequests   [-> User]   requests I sent          |
|  connections       [-> User]   accepted connections     |
|  connectionRequests[-> User]   requests I received      |
|  blockedUsers      [-> User]   users I blocked          |
|  resetPasswordToken  String                             |
|  resetPasswordExpires Date                              |
|  createdAt, updatedAt                                   |
|                                                         |
|  Virtuals: hasPassword, connectionCount, profileUrl     |
|  Statics:  matchPasswordandGenerateToken                |
|            findOrCreateGoogleUser                       |
|  Methods:  canResetPassword, validatePassword           |
|            toPublicJSON, toMinimalJSON                  |
+=========================================================+
                      |
          +-----------+-----------+-----------+
          |           |           |           |
          v           v           v           v
       [POST]     [MESSAGE]  [NOTIF]   [EDUCATION]
       [COMMENT]  [GROUP]    [CONNECTION] [EXPERIENCE]
       [SKILL]    [EVENT]    [HACKATHON]  [USERDETAILS]
       [RESUME]   [JOB]      [SHORT]      [STATUS]
       [POSTIMPRESSION]  [PROFILEVIEW]
```

### POST MODEL (Postmodel.js)

```
_id          ObjectId       PK
createdBy    -> User        required — post author
content      String
imageUrl     String
videoUrl     String
likes        [-> User]      who liked it
bookmarks    [-> User]      who bookmarked it
reposts      Number
repostedBy   [{user->User, comment, createdAt}]
repostedFrom -> Post        self-ref — original post
comments     [{content, createdBy->User, hasGif}]   embedded
tags         [String]
postType     text|image|video|poll|link|repost
poll         {question, options:[{text,votes:[->User]}], totalVotes, endTime}
metadata     {wordCount, hasMedia, linkPreview}
timestamps
```

### MESSAGE MODEL (messagemodel.js)

```
_id          ObjectId       PK
sender       -> User        required
receiver     -> User        required
messageType  text|audio|image|video|location|document|poll|event|contact
content      String
audio        {url, duration, format, size}
image        {url, thumbnail, width, height, size, format, caption}
video        {url, thumbnail, duration, width, height, size, format, caption}
location     {latitude, longitude, duration, isLive, expiresAt}
document     {url, publicId, fileName, fileSize, fileType, fileExtension}
poll         {question, options:[{text, voters:[->User]}], isMultiSelect,
             totalVotes, expiresAt}
event        {title, description, date, location, organizer->User,
             attendees:[{userId->User, status}]}
contacts     [{id->User, name, avatar}]
isRead       Boolean
deletedFor   [-> User]      soft-delete per user
reactions    [{userId->User, emoji, createdAt}]
timestamps
```

### NOTIFICATION MODEL (notificationschema.js)

```
_id              ObjectId    PK
userId           -> User     who receives it
sender           -> User     who triggered it
relatedEntity    ObjectId    POLYMORPHIC — see refPath below
relatedEntityModel String    enum: Post|Comment|Message|User
                             ^ tells Mongoose which collection to query
type             system|message|alert|post|comment|like|...
status           unread|read|archived
priority         1|2|3
actionUrl        String
expiresAt        Date        TTL: 30 days default
readAt           Date
metadata         Mixed
pushSubscription Object
```

**How polymorphic ref works:**
When you call `.populate('relatedEntity')`, Mongoose reads `relatedEntityModel` first, then queries THAT specific collection. One field, four possible targets.

### CONNECTION MODEL (connectionmodel.js)

```
_id          ObjectId    PK
senderId     -> User     required
receiverId   -> User     required
status       pending|connected
createdAt    Date
UNIQUE INDEX on (senderId, receiverId) — prevents duplicate requests
```

### GROUP MODEL (groupmodel.js)

```
_id          ObjectId    PK
name         String      required
creator      -> User
members      [-> User]
image        String URL
lastMessage  -> Message
timestamps
```

### EVENT MODEL (Eventmodel.js)

```
_id          ObjectId    PK
creator      -> User     required
title        String      required
description  String      required
date         Date        required
time         String
location     String
image        {public_id, url}
expiresAt    Date        TTL indexed — auto-delete when event date passes
isTrending   Boolean
timestamps
```

### VOTE MODEL (voteevent.js)

```
_id          ObjectId    PK
user         -> User     required
event        -> Event    required
type         up|down
createdAt    Date
UNIQUE INDEX on (user, event) — one vote per user per event
```

### COMMENTEVENT MODEL (commentevent.js)

```
_id          ObjectId    PK
content      String      required
author       -> User     required
event        -> Event    required
likes        [-> User]
createdAt    Date
```

### HACKATHON MODEL (Hackathonmodel.js)

```
_id               ObjectId    PK
organizer         -> User     required
coOrganizers      [-> User]
participants      [{user->User, registeredAt,
                   status: registered|checked-in|submitted|winner}]
prizes            [{name, description, value, currency, winners:[->Team]}]
name              String      required 5-100 chars
slug              String      UNIQUE, auto-generated from name by pre-save hook
description       String      required max 2000 chars
shortDescription  String      max 200 chars
startDate         Date        must be in future
endDate           Date        must be after startDate
registrationDeadline Date     must be before startDate
timezone          String      default UTC
location          {type: online|in-person|hybrid, address, coordinates}
                  coordinates use 2dsphere geo index
website           String      URL-validated
tags              [String]    max 10
tracks            [{name, description}]
prizePool         Number
maxTeamSize       Number      1-10, default 4
minTeamSize       Number      >= 1
participationType individual|team|both
eligibility       {minAge, maxAge, countries[], studentOnly, newCodersOnly}
requirements      {githubRepo, demoVideo, presentation, liveDemo}
judgingCriteria   [{name, description, weight: 0-100}]
schedule          [{title, startTime, endTime, type, speakers[]}]
sponsors          [{name, tier: platinum|gold|silver|bronze, logo, website}]
media             {coverImage, thumbnail, gallery:[String]}
socialLinks       {twitter, linkedin, instagram, discord, slack}
status            draft|published|ongoing|completed|cancelled
Virtual: durationInDays
Statics: upcoming()
Methods: isRegistrationOpen()
```

### EDUCATION MODEL (educationModel.js)

```
_id          ObjectId    PK
userId       -> User     required
collegeName  String      required
degree       String      required
fieldOfStudy String
startDate    Date        required
endDate      Date
gpa          String
description  String
skills       String
university   String
collegeType  String
state        String
district     String
logo         String URL
createdAt    Date
```

### EXPERIENCE MODEL (experiencemodel.js)

```
_id          ObjectId    PK
userId       -> User     required
company      String      required
jobTitle     String      required
startDate    Date        required
endDate      Date        null = currently working here
description  String      required
```

### SKILL MODEL (skillmodel.js)

```
_id          ObjectId    PK
userId       -> User     UNIQUE index — one Skill doc per user (1:1 relationship)
skills       [String]    lowercase, deduplicated by pre-save hook
skillLevels  Object      { skillName: 1-5 } map, synced by hook
timestamps
```

### USERDETAILS MODEL (adddatamodel.js)

```
_id              ObjectId    PK
userId           -> User
backgroundImage  {public_id, secure_url}  Cloudinary asset
socialLinks      {linkedin, github, instagram, facebook, twitter,
                 website, youtube, medium, other}
interests        [String]
location         String
occupation       String
achievements     [String]
hobbies          [String]
timestamps
```

### ROOM MODEL (roommodel.js)

```
_id          ObjectId    PK
roomId       String      UNIQUE human-readable e.g. "abc-123"
users        [{userId, username, socketId, isMicOn, isVideoOn, isScreenSharing}]
isActive     Boolean     default true
iceServers   [{urls, username, credential}]
createdAt    Date        TTL: 86400s (24 hours) — auto-deleted
```

### RESUME MODEL (Resumemodel.js)

```
_id             ObjectId    PK
userId          String      raw string, no ObjectId FK
fileName        String      required
filePath        String URL  required
jobDescription  String      optional comparison target
analysisResult  {
  matchPercentage Number 0-100
  atsScore        Number 0-100
  skillsMatch     {Programming:[String], DataScience:[String], DevOps:[String]}
  recommendations [String]
}
timestamps
```

### JOB MODEL (Jobsmodel.js)

```
_id          ObjectId    PK
Title        String      required
Description  String      required
Company      String      required
Location     String      required
Salary       String      required
Experience   String      required
Skills       [String]    required
Email        String      required
Phone        String
Website      String
Type         fulltime|parttime|internship|remote
Requirements [String]
createdAt    Date
Note: No FK to User — jobs are standalone listings
```

### SHORT VIDEO MODEL (shortmodel.js)

```
_id          ObjectId    PK
userId       String      raw, no ObjectId FK
videoUrl     String      Cloudinary CDN URL
caption      String
likes        [String]    userId strings
dislikes     [String]    userId strings
comments     [{userId, text, createdAt}]   embedded subdocuments
shareCount   Number
createdAt    Date
```

### STATUS/STORY MODEL (statuseditmodel.js)

```
_id             ObjectId    PK
userId          String      raw, no ObjectId FK
name            String      required (display name for story)
userProfilePic  String
media           [String]    URLs
textElements    [{id, text, style:{fontSize,color,fontFamily,fontWeight,textShadow},
                 position:{x,y}}]
stickerElements [{id, url, position:{x,y}, size}]
filter          {brightness, contrast, saturation, blur, hueRotate, dropShadow}
music           {id, name, path}
likes           [{userId, userProfilePic, userName, createdAt}]
comments        [{userId, userProfilePic, userName, text, createdAt}]
createdAt       Date    TTL: 86400s (24 hours) — auto-deleted
```

### POST IMPRESSION MODEL (PostImpression.js)

```
_id              ObjectId    PK
postId           -> Post     required
userId           -> User     required
sessionId        String
interactionType  view|like|share|comment|save|click|hover|scroll
duration         Number      milliseconds on page
interactionCount Number
isOrganic        Boolean
deviceType       mobile|desktop|tablet
os               ios|android|windows|macos|linux
browser          chrome|safari|firefox|edge|opera
screenResolution {width, height}
referrer         direct|search|social|email|notification|ads|other
referrerUrl      String
campaignId, utmSource, utmMedium, utmCampaign  String
ipAddress, country, region, city  String
timestamp        Date        TTL indexed
lastInteractionAt Date
Virtual: engagementScore
  view=1, hover=2, scroll=3, click=5, like=8, comment=10, save=12, share=15
```

### TRENDING MODEL (Trendingmodel.js)

```
_id          ObjectId    PK
title        String      required
description  String      required
image        String URL
tags         [String]
popularity   Number      default 0, higher = more popular
createdAt    Date
```

### PROFILE VIEW MODEL (ProfileView.js)

```
_id          ObjectId    PK
profileId    String      raw userId of profile owner (who was viewed)
viewerId     String      raw userId of visitor (who viewed)
timestamp    Date
```

### STATS MODEL (Stats.js)

```
_id            ObjectId    PK
totalVisitors  Number      default 0
Note: Single document, incremented on each new unique visitor
```

### VISITOR COUNT MODEL (VisitorCount.js)

```
_id          ObjectId    PK
ip           String      visitor IP address
deviceId     String      browser fingerprint
firstVisit   Date
lastVisit    Date
```

---

## 8. Complete FK Relationships Table

| From Model | Field | References | Cardinality | Meaning |
|---|---|---|---|---|
| User | connections[] | User | M:M self | Accepted mutual connections |
| User | pendingRequests[] | User | M:M self | Requests I sent, not accepted |
| User | connectionRequests[] | User | M:M self | Requests others sent me |
| User | blockedUsers[] | User | M:M self | Users I blocked |
| Post | createdBy | User | M:1 | Post author |
| Post | likes[] | User | M:M | Who liked this post |
| Post | bookmarks[] | User | M:M | Who bookmarked |
| Post | repostedFrom | Post | Self-ref | Original post for repost |
| Post | repostedBy[].user | User | M:M | Who reposted |
| Post | poll.options[].votes[] | User | M:M | Voters per option |
| Post | comments[].createdBy | User | M:1 | Embedded comment author |
| Comment | postId | Post | M:1 | Which post this belongs to |
| Comment | createdBy | User | M:1 | Comment author |
| Message | sender | User | M:1 | Who sent it |
| Message | receiver | User | M:1 | Who receives it |
| Message | poll.options[].voters[] | User | M:M | In-message poll voters |
| Message | event.organizer | User | M:1 | Event organiser in message |
| Message | event.attendees[].userId | User | M:M | Event attendees in message |
| Message | contacts[].id | User | M:M | Shared contact references |
| Message | deletedFor[] | User | M:M | Who soft-deleted this |
| Message | reactions[].userId | User | M:1 | Who reacted |
| Notification | userId | User | M:1 | Who receives the notification |
| Notification | sender | User | M:1 | Who triggered it |
| Notification | relatedEntity | Post OR Comment OR Message OR User | Polymorphic | The entity that caused it |
| Connection | senderId | User | M:1 | Who sent the request |
| Connection | receiverId | User | M:1 | Who received it |
| Education | userId | User | M:1 | Profile owner |
| Experience | userId | User | M:1 | Profile owner |
| Skill | userId | User | 1:1 (unique) | One Skill doc per user |
| UserDetails | userId | User | M:1 | Extended profile owner |
| PostImpression | postId | Post | M:1 | Tracked post |
| PostImpression | userId | User | M:1 | Who interacted |
| Event | creator | User | M:1 | Who created the event |
| Vote | user | User | M:1 | Voter |
| Vote | event | Event | M:1 | Event being voted on |
| CommentEvent | author | User | M:1 | Comment author |
| CommentEvent | event | Event | M:1 | Event being commented on |
| CommentEvent | likes[] | User | M:M | Who liked this event comment |
| Hackathon | organizer | User | M:1 | Main organiser |
| Hackathon | coOrganizers[] | User | M:M | Co-organisers |
| Hackathon | participants[].user | User | M:M | Registrants |
| Group | creator | User | M:1 | Group creator |
| Group | members[] | User | M:M | All group members |
| Group | lastMessage | Message | 1:1 | Most recent message |

---

## 9. Pre-save Hooks and TTL Auto-Delete

### Pre-save Hooks — Business Logic at Model Level

A pre-save hook runs automatically **before any `.save()`** call, anywhere in the app.

```
User.save() called anywhere
    |
    +-- Hook 1: Password hashing
    |   IF password modified AND not Google OAuth user:
    |     1. Validate regex /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%...]).{8,}$/
    |        Fail -> error propagates -> 400 response
    |     2. bcrypt.genSalt(12)      12 rounds = secure and slow
    |     3. bcrypt.hash(password, salt) -> "$2b$12$..." (60-char hash)
    |     4. this.password = hash    Plain text NEVER stored
    |
    +-- Hook 2: Profile completion check
    |   Check: name AND bio AND jobTitle AND company AND profilePicture
    |   All present -> this.profileCompleted = true
    |   Any missing -> this.profileCompleted = false
    |
    +-- Hook 3: Last seen
        IF isOnline changed false -> this.lastSeen = new Date()
```

| Model | What Hook Does |
|---|---|
| User | Hash password with bcrypt 12 rounds, validate regex complexity |
| User | Auto-compute profileCompleted boolean |
| User | Set lastSeen when going offline |
| Hackathon | Auto-generate URL-safe slug from name field |
| Skill | Lowercase + deduplicate skills[], sync skillLevels map (add missing->1, remove orphans) |
| Resume | Ensure skillsMatch arrays are string[], update updatedAt |

### TTL Indexes — MongoDB Auto-Delete

```javascript
// statuseditmodel.js:
statusSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
// MongoDB background task checks every ~60s, deletes where:
// Date.now() - createdAt > 86400 seconds (24 hours)
```

| Model | TTL Field | Duration | Effect |
|---|---|---|---|
| Status/Story | createdAt | 24 hours | Stories vanish like WhatsApp/Instagram |
| Room | createdAt | 24 hours | Stale video rooms auto-cleaned |
| Event | expiresAt | On set date | Events deleted when the date passes |
| Notification | expiresAt | 30 days | Old notifications purged |

---

## 10. GraphQL Deep Dive

### Why GraphQL?

- REST over-fetches: `GET /messages` returns ALL fields even if you only need 3
- REST under-fetches: need 2 separate requests for messages + user profiles
- GraphQL: one endpoint, client declares exactly what it wants

In Linkipax, GraphQL covers the **messaging query layer**. REST handles everything else.

### How Apollo Server Mounts on Express

```javascript
// server.js exact code:
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers } = require('./GraphQL/messageschema');

const apolloServer = new ApolloServer({ typeDefs, resolvers });
await apolloServer.start();  // v3 requires explicit async start
apolloServer.applyMiddleware({ app, cors: false });
// Mounted at:
//   POST http://localhost:5001/graphql  -> queries + mutations
//   GET  http://localhost:5001/graphql  -> Apollo Playground UI (dev)
```

### The Schema (GraphQL/messageschema.js)

```graphql
type Message {
  _id:        ID!       # MongoDB ObjectId
  senderId:   String!   # Who sent it
  receiverId: String!   # Who receives it
  content:    String!   # Text content
  createdAt:  String!   # ISO date string
}

type Query {
  # Fetch complete two-way conversation history between two users
  getMessages(userId: String!, targetUserId: String!): [Message]
}

type Mutation {
  # Create a new message, return it so client can display immediately
  sendMessage(senderId: String!, receiverId: String!, content: String!): Message
}
```

### Resolvers (JavaScript Implementation)

```javascript
const resolvers = {
  Query: {
    getMessages: async (_, { userId, targetUserId }) => {
      const Message = mongoose.model("Message");
      return await Message.find({
        $or: [
          { senderId: userId,       receiverId: targetUserId },  // messages I sent
          { senderId: targetUserId, receiverId: userId       },  // messages they sent
        ]
      });
    }
  },
  Mutation: {
    sendMessage: async (_, { senderId, receiverId, content }) => {
      const Message = mongoose.model("Message");
      const msg = new Message({ senderId, receiverId, content });
      await msg.save();
      return msg;
    }
  }
};
```

### Frontend Usage (GraphQL/Mutate.js)

```javascript
import { gql, useQuery, useMutation } from "@apollo/client";

const GET_MESSAGES = gql`
  query GetMessages($senderId: String!, $receiverId: String!) {
    getMessages(senderId: $senderId, receiverId: $receiverId) {
      id      # Only asking for 3 fields -- NOT the full document
      content
      timestamp
    }
  }
`;

// useQuery auto-fetches and re-fetches when variables change
const { data, loading } = useQuery(GET_MESSAGES, {
  variables: { senderId: myId, receiverId: partnerId }
});

// useMutation gives you a function to call imperatively
const [sendMessage] = useMutation(SEND_MESSAGE);
await sendMessage({ variables: { senderId, receiverId, content: text } });
```

### When to Use Each Protocol

| Operation | Protocol | Why |
|---|---|---|
| Fetch message history | GraphQL /graphql | Client picks exact fields, no over-fetching |
| Send real-time message | Socket.IO send_message | Instant delivery, zero HTTP overhead |
| Create a post | REST POST /api/posts | File upload needs multipart, REST handles well |
| Login and get JWT cookie | REST POST /user/login | Cookie-setting requires HTTP response headers |
| WebRTC video signaling | Socket.IO signal | Sub-millisecond relay for video negotiation |
| Get notifications list | REST GET /api/notifications | Standard paginated list |

---

## 11. Middleware Every Layer Explained

### What is Middleware?

A function between the HTTP request and your route handler. It receives `(req, res, next)` and must either:
- Modify req/res and call `next()` to pass control forward
- Call `res.json()` to end the request right there

```
Request
  |
  v
[cors] -> [session] -> [json] -> [helmet] -> [morgan] -> [cookieParser] -> [Route Handler]
 Each middleware can add data to req, add headers to res, or end the chain
```

### Global Middleware (runs for EVERY request)

| Middleware | Reads | Sets / Does |
|---|---|---|
| cors() | Origin header | Access-Control-Allow-* headers, allows Vercel to send cookies |
| trust proxy | (setting) | req.secure = true behind Render/Railway proxy |
| express-session | Session cookie | Loads/saves server-side session (needed for Passport OAuth) |
| express.json() | Request body bytes | req.body = parsed JS object |
| helmet() | (nothing) | Adds 15+ security response headers |
| morgan('tiny') | (nothing) | Logs "POST /api/posts 201 45ms" to console + file |
| cookieParser() | Cookie header | req.cookies = { auth_token: "eyJ..." } |
| passport | Session | Deserialises OAuth user |

### Route-Level Middleware — checkForAuthenticationCookie()

```
Applied to: Most browser-facing routes

  token = req.cookies['auth_token']
              |
         present?
        /        \
      NO           YES
  strict=true?    jwt.verify(token, JWT_SECRET_KEY)
  /        \           |                |
401        next()  Expired/Invalid    Valid payload
(anon)             |                    |
              strict? 401            req.user = payload
              else next()              |
                                     next()
```

### Route-Level Middleware — checkForAuthenticationHeader()

```
Applied to: API-style routes (Postman, mobile apps)

  req.headers['authorization'] = "Bearer eyJhbGciOiJIUzI1NiJ9..."
    |
  Split on space -> extract TOKEN
    |
  jwt.verify(TOKEN) -> decoded
    |
  decoded.userId exists? -> req.user = decoded -> next()
```

### Route-Level Middleware — auth.js (X-User-ID)

```
Applied to: Lightweight internal routes

  req.headers['x-user-id']
    |
  present? NO -> 401
  valid 24-char hex? NO -> 400
  req.user = { id: userId }
  next()
```

### Route-Level Middleware — multer.js (file upload)

```
Applied to: Short video upload route only

  Validate MIME type: video/mp4, video/quicktime, video/x-msvideo
  Validate size: max 60 MB
  Save to: tmp/uploads/short-{timestamp}-{random}.{ext}
  Set: req.file = { path, filename, size, mimetype }
  Then controller: reads req.file.path -> uploads to Cloudinary -> deletes local
```

### Complete Request Lifecycle Example

```
Browser: POST /api/posts
  Cookie: auth_token=eyJhbGciOiJIUzI1NiJ9...
  Body:   { "content": "New post!", "imageUrl": "..." }

GLOBAL CHAIN:
  cors()         -> Origin OK, headers added
  express.json() -> req.body = { content: "New post!", imageUrl: "..." }
  helmet()       -> Security headers queued
  morgan()       -> "POST /api/posts" logged
  cookieParser() -> req.cookies.auth_token = "eyJhbGciOiJIUzI1NiJ9..."
  passport()     -> No OAuth session to restore

ROUTE MATCH: /api/posts -> PostRoutes.js

ROUTE MIDDLEWARE: checkForAuthenticationCookie('auth_token', {strict:true})
  -> token present: OK
  -> jwt.verify(token): valid, not expired
  -> req.user = { userId: "abc123", username: "john", ... }
  -> next()

CONTROLLER:
  const post = await Post.create({
    content: req.body.content,
    imageUrl: req.body.imageUrl,
    createdBy: req.user.userId    <- came from JWT payload
  });
  res.status(201).json({ post });

RESPONSE: HTTP 201 { post: { _id, content, createdBy, ... } }
```

---

## 12. Real-Time System Socket.IO and WebRTC

### Why Socket.IO Instead of Polling?

```
REST polling (inefficient):          Socket.IO (efficient):

Client        Server                 Client          Server
  |--GET /msgs-->|                     |                |
  |<-- [] ------|   (wait 3s)          |                |
  |--GET /msgs-->|                     |    msg arrives |
  |<-- [] ------|   (wait 3s)          |                |
  |--GET /msgs-->|   msg arrives       |<---new_message-|
  |<-- [msg] ---|   3 SECONDS LATE     | INSTANT!       |
```

### User Registration and Online Tracking

```
Client: socket.emit('join', userId)

Server: socket.on('join', userId => {
  users[userId] = socket.id
  // users = { "abc123": "x7Kp2", "def456": "m3Qr9" }
  // In-memory map: used to find any online user's socket
})

When A messages B:
  io.to(users[B_userId]).emit('new_message', messageData)
  If users[B_userId] is undefined -> B is offline -> send web push instead
```

### Direct Message Delivery Sequence

```
Sender A               Server                Receiver B
    |                     |                     |
    |--send_message------->|                     |
    |  {sender, receiver,  |  1. Message.save()  |
    |   content, type}     |                     |
    |                     |  2. emit 'message_sent' back to A
    |<--message_sent------|                     |
    |                     |                     |
    |                     |  3. users[B] exists? |
    |                     |     YES -> online    |
    |                     |  io.to(users[B])     |
    |                     |  .emit('new_message')----------->|
    |                     |                     | instant!
    |                     |  4. Notification.save()
    |                     |  5. io.to(users[B]).emit('new_notification')-->|
    |                     |  6. sendWebPushToUser(B) if offline
```

### WebRTC Video Call Signaling

WebRTC connects browsers peer-to-peer for video. Socket.IO relays the setup negotiation (SDP offers/answers and ICE candidates). Video/audio never touches the server.

```
User A                Server                User B
  |--join-meeting----->|                      |
  |  {meetingId,...}   |  socket.join(room)   |
  |                    |  Update Room in DB   |
  |<--existing-users---|  [current users]     |
  |                    |<---join-meeting-------|
  |<---user-joined-----|----user-joined------->|
  |                    |                      |
  |  [A creates RTCPeerConnection, offer SDP] |
  |--signal----------->|--signal------------->|
  |  {to: B_socketId,  |                      |
  |   signal: {offer}} |  [B generates answer]|
  |<---signal----------|<---signal------------|
  |  {signal: {answer}}|                      |
  |                    |                      |
  |--ice-candidate---->|--ice-candidate------->|
  |<---ice-candidate---|<---ice-candidate------|
  |                    |                      |
  |<====VIDEO+AUDIO P2P STREAM (NOT via server)=========>|
```

### All Socket.IO Events

| Event | Direction | Purpose |
|---|---|---|
| join | Client->Server | Register online, store userId->socketId |
| send_message | Client->Server | Send a direct message |
| message_sent | Server->Client | ACK saved message to sender |
| new_message | Server->Client | Deliver message to receiver |
| message_error | Server->Client | Message save failed |
| send_notification | Client->Server | Trigger custom notification |
| new_notification | Server->Client | Deliver notification |
| mark_notification_read | Client->Server | Mark a notification read |
| notification_read | Server->Client | Confirm marked |
| join-meeting | Client->Server | Enter video call room |
| existing-users | Server->Client | Current room participants |
| user-joined | Server->Client | Broadcast new participant |
| leave-meeting | Client->Server | Leave video room |
| user-left | Server->Client | Broadcast departure |
| signal | Client->Server->Client | Relay WebRTC offer/answer |
| ice-candidate | Client->Server->Client | Relay ICE candidates |
| start-screen-share | Client->Server | Begin screen share |
| screen-share-started | Server->Client | Notify room |
| stop-screen-share | Client->Server | End screen share |
| screen-share-stopped | Server->Client | Notify room |
| user-status-update | Client->Server | Mic/camera toggled |
| send-message (room) | Client->Server | In-room text chat |
| receive-message | Server->Client | Broadcast text chat to room |
| disconnect | Auto | Tab closed / network dropped |

### Disconnect Cleanup

```
socket disconnects
  1. Search users{} for socket.id -> delete entry
  2. Query Room for rooms containing this socketId
  3. Emit 'user-left' to that room
  4. Remove user from Room.users in DB
  5. If Room.users is now empty -> set Room.isActive = false
```

---

## 13. Authentication JWT and Google OAuth

### What is a JWT?

```
eyJhbGciOiJIUzI1NiJ9  .  eyJ1c2VySWQiOiJhYmMxMjMifQ  .  SflKxwRJSMeKKF2QT4fwp
      HEADER                        PAYLOAD                     SIGNATURE
  (alg: HS256)           {userId, email, username...}    HMAC(header+payload, secret)
```

Anyone can READ the payload. Only the server can VERIFY it — needs JWT_SECRET_KEY.

### Registration

```
POST /user/register { username, email, password }
  |
  v
User.create(...)
  |
  v  (pre-save hook)
1. Validate regex: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%...]).{8,}$/
   Fail -> 400 Bad Request
   Pass:
2. bcrypt.genSalt(12)             12 rounds = takes ~250ms (defeats brute force)
3. bcrypt.hash(password, salt)    -> "$2b$12$..." 60-char hash
4. this.password = hash           Plain text NEVER stored
  |
  v
Document saved to MongoDB
Response: { success: true }
```

### Login

```
POST /user/login { identifier: "john OR john@email.com", password: "Secret@123" }
  |
  v
User.findOne({ $or: [{ username }, { email }] })
  |
  v
bcrypt.compare("Secret@123", storedHash)
  false -> throw Error('Invalid credentials')
  true  ->
  |
  v
jwt.sign({
  userId, email, username, name,
  profilePicture, isVerified, profileCompleted
}, JWT_SECRET_KEY, { expiresIn: '7d' })
  |
  v
res.cookie('auth_token', token, {
  httpOnly: false,       SPA needs JS access
  secure: true,          HTTPS only
  sameSite: 'none',      Cross-origin Vercel <-> Render
  maxAge: 604800000      7 days in ms
})
res.json({ token, user })
```

### Google OAuth (9 Steps)

```
1. GET /user/auth/google
2. Passport redirects: accounts.google.com/o/oauth2/auth?scope=profile email
3. User logs in and grants permission on Google
4. Google redirects: GET /user/auth/google/callback?code=xyz
5. Passport exchanges code for profile:
     { id, displayName, emails:[{value}], photos:[{value}] }
6. User.findOrCreateGoogleUser(profile)
     Try: findOne({ googleId: profile.id })
     Try: findOne({ email: profile.emails[0].value })
     Create: { googleId, email, username(auto), name, isVerified:true,
               password: bcrypt(randomBytes) // placeholder, unusable }
7. generateGoogleAuthToken(user)
     jwt.sign({..., authMethod:'google'}, secret, {expiresIn:'30d'})
8. res.cookie('auth_token', token)
9. res.redirect(FRONTEND_URL + '/dashboard')
```

### Per-Request Token Verification

```
checkForAuthenticationCookie() before every protected route:

1. req.cookies['auth_token'] -> undefined? strict? 401 : next() anonymously
2. jwt.verify(token, JWT_SECRET_KEY)
   - Verifies HMAC signature: was this signed by our server?
   - Checks exp claim: is this token still valid?
   - TokenExpiredError -> 401 "Token expired"
   - JsonWebTokenError -> 401 "Invalid token"
3. req.user = { userId, email, username, name, ... }
4. next() -> your controller runs
```

---

## 14. File Uploads Cloudinary Pipeline

### Short Video Upload

```
Client                      Server                   Cloudinary CDN
  |                             |                         |
  |--POST /api/short ---------->|                         |
  |  (multipart video field)    |                         |
  |                             |                         |
  |              [multer middleware]                       |
  |              Validate type + size (max 60MB)           |
  |              Save to tmp/uploads/short-xyz.mp4         |
  |              req.file.path set                         |
  |                             |                         |
  |              [shortController]                         |
  |              cloudinary.uploader.upload(               |
  |                req.file.path,                          |
  |                { folder:'Linkipax-shorts',             |
  |                  resource_type:'auto' }                |
  |              )                                         |
  |                             |-- Upload in chunks ----->|
  |                             |<-- { url, public_id } ---|
  |              unlinkAsync(req.file.path) <- delete local |
  |              Short.create({ userId, videoUrl: url })   |
  |<-- { success, videoUrl } ---|                         |
```

### Profile Picture (Direct to Cloud)

```
multer({ storage: profilePicStorage })  // CloudinaryStorage engine
  File streams directly HTTP -> Cloudinary (no local file created)
  Cloudinary auto-crops to 500x500
  req.file.path = "https://res.cloudinary.com/.../image.jpg"
  User.findByIdAndUpdate(id, { profilePicture: req.file.path })
```

### Event Image

```
uploadImage(localFilePath):
  1. cloudinary.uploader.upload(path, { folder: 'event_images' })
  2. Success or Failure -> unlinkAsync(path)  always delete local
  3. Return { url, public_id }  saved in Event document
```

---

## 15. Web Push Notifications VAPID

Sends browser notifications even when the website tab is closed.

### User Subscription Setup

```
1. Browser: const sub = await navigator.serviceWorker.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: VAPID_PUBLIC_KEY
            })
2. Frontend sends: POST /api/notifications/subscribe { subscription: sub }
3. Server saves:   User.findByIdAndUpdate(userId, {
                     pushSubscription: sub, pushEnabled: true
                   })
```

### Sending a Push

```
sendWebPushToUser(userId, { title, body, url })
  |
  v
User.findById(userId).select('pushSubscription pushEnabled')
  |
  +-- pushEnabled=false OR no subscription
  |     -> return { success: false, reason: 'not_subscribed' }
  |
  +-- subscription exists
        |
        v
      webpush.sendNotification(sub, JSON.stringify(payload))
        |
        +-- 410 Gone  -> expired -> User.updateOne clear pushSubscription
        +-- 400/404   -> invalid -> clear subscription
        +-- 429       -> rate limited -> log
        +-- 200       -> browser shows notification even with tab closed
```

---

## 16. Complete API Route Reference

### /user — Auth and Profile

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /user/register | none | Create account |
| POST | /user/login | none | Login, set JWT cookie |
| POST | /user/logout | cookie | Clear cookie |
| GET | /user/auth/google | none | Start Google OAuth |
| GET | /user/auth/google/callback | none | OAuth redirect |
| GET | /user/profile/:id | cookie | Get profile |
| PUT | /user/profile/:id | cookie | Update profile |
| PUT | /user/change-password | cookie | Change password |
| POST | /user/forgot-password | none | Send reset email |
| POST | /user/reset-password/:token | none | Reset with token |
| POST | /user/push-subscribe | cookie | Subscribe to web push |

### /api/posts — Post Feed

| Method | Path | Purpose |
|---|---|---|
| GET | /api/posts | Feed (paginated) |
| POST | /api/posts | Create post |
| GET | /api/posts/:id | Single post |
| PUT | /api/posts/:id/like | Toggle like |
| PUT | /api/posts/:id/bookmark | Toggle bookmark |
| POST | /api/posts/:id/repost | Repost |
| POST | /api/posts/:id/poll/vote | Poll vote |
| PUT | /api/posts/:id | Edit post |
| DELETE | /api/posts/:id | Delete post |

### / — Direct Messages

| Method | Path | Purpose |
|---|---|---|
| GET | /messages/:userId | Conversation history |
| POST | /messages/send | Send message (REST) |
| DELETE | /messages/:id | Soft-delete |
| POST | /messages/:id/react | Emoji reaction |
| GET | /conversations | All conversations |

### /api/notifications

| Method | Path | Purpose |
|---|---|---|
| GET | /api/notifications | List notifications |
| GET | /api/notifications/unread-count | Count unread |
| PUT | /api/notifications/:id/read | Mark one read |
| PUT | /api/notifications/read-all | Mark all read |
| DELETE | /api/notifications/:id | Delete one |
| DELETE | /api/notifications | Delete all |

### /connections

| Method | Path | Purpose |
|---|---|---|
| POST | /connections/request | Send request |
| PUT | /connections/accept | Accept |
| PUT | /connections/reject | Reject |
| DELETE | /connections/remove | Remove connection |
| GET | /connections/list | My connections |
| GET | /connections/pending | Incoming requests |
| GET | /connections/sent | Outgoing requests |

### /api/groups

| Method | Path | Purpose |
|---|---|---|
| POST | /api/groups | Create group |
| GET | /api/groups | My groups |
| POST | /api/groups/:id/members | Add member |
| DELETE | /api/groups/:id/members/:userId | Remove member |
| POST | /api/groups/:id/messages | Send message |
| GET | /api/groups/:id/messages | Get messages |

### /api/events

| Method | Path | Purpose |
|---|---|---|
| GET | /api/events | List events |
| POST | /api/events | Create event |
| GET | /api/events/:id | Event detail |
| POST | /api/events/:id/vote | Vote |
| POST | /api/events/:id/comment | Comment |
| GET | /api/events/trending | Trending events |

### Other Endpoints

| Mount Point | Purpose |
|---|---|
| GET/POST /skill | Skills CRUD + proficiency levels |
| GET/POST /education | Education history CRUD |
| GET/POST /experience | Work experience CRUD |
| POST /upload | Resume PDF upload + Python AI analysis |
| POST /api/short | Upload short video |
| GET /api/short | List short videos |
| GET/POST /api/status | Stories CRUD |
| GET/POST /jobs | Job board CRUD |
| POST /api/room | Create video room |
| GET /api/room/:id | Get room + ICE servers |
| GET /search | Search users, posts, hackathons |
| POST /visitor | Log a visitor |
| GET /visitor/count | Visitor statistics |
| POST /post-impression | Track post interaction |
| GET /post-impression/:postId | Post analytics |
| POST /profile-view | Log profile visit |
| GET /profile-view/:id | Who viewed my profile |
| GET /api/user/suggestions | AI connection suggestions |
| GET /api/trending-topics | Trending topics |
| GET /external/trends | Google Trends proxy |
| GET /graphql | Apollo Playground |
| POST /graphql | GraphQL queries and mutations |

---

## 17. Environment Variables

Create `server/.env`:

```
# Server
PORT=5001
NODE_ENV=production
FRONTEND_ORIGIN=https://linlifys.vercel.app

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/Linkipax

# JWT
JWT_SECRET_KEY=at_least_32_random_characters_here
JWT_EXPIRATION=7d
SESSION_SECRET=another_random_string

# Google OAuth
GOOGLE_CLIENT_ID=12345.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_CALLBACK_URL=https://your-server.com/user/auth/google/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_api_secret

# Web Push VAPID
# Generate: node -e "const wp=require('web-push'); console.log(wp.generateVAPIDKeys())"
VAPID_PUBLIC_KEY=BLxxx...
VAPID_PRIVATE_KEY=xxx...

# AI APIs
OPENAI_API_KEY=sk-proj-xxx
GOOGLE_AI_API_KEY=AIzaSyxxx

# Logging
LOG_LEVEL=info
```

---

## 18. Running Locally

### Backend

```bash
git clone https://github.com/LinkiPax/Linlifys.git
cd Linlifys/Linkify/server
npm install
cp .env.example .env  # fill in your keys
npm start
# Server running at port 5001
# MongoDB connected successfully
```

### Frontend

```bash
cd ../Linkipax
npm install
npm run dev
# http://localhost:5173
```

### Docker

```bash
cd server
docker-compose up --build
```

### Verify Everything Works

```bash
# Health check
curl http://localhost:5001/test
# Expected: { "success": true }

# GraphQL Playground
open http://localhost:5001/graphql
```

---

---

## 19. Complete Database Key Theory + Full ER Analysis

> This section applies formal database theory to every model in this project.
> Study each model's key analysis and ER diagram to understand how real-world NoSQL
> schemas map to relational database concepts.

---

### 19.1 Key Types — Theory First

Before we apply them, here is what every key type means:

```
KEY HIERARCHY
═════════════════════════════════════════════════════════════
SUPER KEY
  └─ Any attribute (or set of attributes) that uniquely
     identifies a row/document. Can have extra attributes.

  CANDIDATE KEY  (minimal super key — no redundant attributes)
    ├─ PRIMARY KEY
    │    └─ The ONE candidate key chosen to identify the record.
    │       MongoDB uses _id (ObjectId) as default PK.
    │       Cannot be NULL. Only one per table.
    │
    └─ ALTERNATE KEY
         └─ Every candidate key that was NOT chosen as PK.
            e.g., email when _id is PK.

FOREIGN KEY
  └─ An attribute whose value references the PRIMARY KEY
     of another table/collection. Enforces referential integrity.

COMPOSITE / COMPOUND KEY
  └─ A key made of TWO or more attributes together.
     Neither alone is unique; only the combination is.
     e.g., (senderId + receiverId) in Connection model.

SIMPLE KEY
  └─ A key made of exactly ONE attribute.
     e.g., _id alone is the PK in most models.

NATURAL KEY
  └─ A key formed from real-world data that already exists
     in the domain (has business meaning).
     e.g., email, username, googleId.

SURROGATE KEY
  └─ An artificial key with no business meaning, generated
     purely for uniqueness. MongoDB ObjectId (_id) is a
     surrogate key — it is a random 12-byte value.

UNIQUE KEY
  └─ Like a primary key but allows ONE NULL and there can
     be multiple unique keys per table.
     e.g., email UNIQUE, username UNIQUE, googleId UNIQUE.

PARTIAL KEY
  └─ An attribute that partially identifies a WEAK ENTITY.
     A weak entity cannot be uniquely identified without its
     parent (owner) entity. In MongoDB, embedded subdocuments
     use partial keys (their local id alone is not globally unique).
═════════════════════════════════════════════════════════════
```

---

### 19.2 Relationship Types — Theory First

```
RELATIONSHIP TYPES
═════════════════════════════════════════════════════════════

1 : 1   One-to-One
  └─ One record in A relates to exactly one record in B.
     e.g., User (1) <-> Skill (1)

1 : N   One-to-Many
  └─ One record in A relates to many records in B.
     e.g., User (1) <-> Post (many)

M : N   Many-to-Many
  └─ Many records in A relate to many records in B.
     Needs a junction/join table in SQL.
     In MongoDB: done with arrays of ObjectIds.
     e.g., Post.likes [User IDs]

UNARY / RECURSIVE
  └─ A relationship between records of the SAME entity.
     e.g., User.connections -> User (self-join)

BINARY
  └─ A relationship between TWO entities. Most common type.
     e.g., User -> Post

TERNARY
  └─ A relationship involving THREE entities simultaneously.
     e.g., User + Event + Vote (a User votes on an Event)

N-ARY
  └─ A relationship involving N entities (generalisation of ternary).
     e.g., Hackathon.participants: User + Hackathon + Team + Status
═════════════════════════════════════════════════════════════

PARTICIPATION CONSTRAINTS
═════════════════════════════════════════════════════════════

TOTAL PARTICIPATION  (double line ══ in ER diagrams)
  └─ EVERY instance of the entity MUST participate in the
     relationship. If A totally participates with B, then
     every A must have at least one B.
     e.g., Every Post MUST have a createdBy (User). A Post
     cannot exist without an author.

PARTIAL PARTICIPATION  (single line ── in ER diagrams)
  └─ Some instances MAY participate, but it is not required.
     e.g., A User MAY have connections, but doesn't have to.
     A User with zero connections is still valid.
═════════════════════════════════════════════════════════════
```

---

### 19.3 ER Diagram Notation Used in This Section

```
ENTITY                  ATTRIBUTE             RELATIONSHIP
┌──────────┐            ┌──────────┐          ╔══════════╗
│  MODEL   │            │ fieldname│          ║  verb    ║
│   NAME   │            │ (type)   │          ╚══════════╝
└──────────┘            └──────────┘

KEY MARKERS ON ATTRIBUTES:
  [PK]  = Primary Key      (surrogate, MongoDB _id)
  [AK]  = Alternate Key    (natural unique field like email)
  [UK]  = Unique Key       (unique but not PK)
  [FK]  = Foreign Key      (ObjectId ref to another model)
  [CK]  = Composite Key    (two+ fields together form key)
  [NK]  = Natural Key      (has real-world meaning)
  [SK]  = Surrogate Key    (artificial, no business meaning)
  [PaK] = Partial Key      (key of a weak/embedded entity)
  [CPK] = Composite PK     (PK made of multiple fields)

RELATIONSHIP LINES:
  ──────  Partial participation (optional)
  ══════  Total participation  (mandatory, must exist)
  ──|──   Exactly one (1 side)
  ──<──   Many side (N)
  ══|══   Exactly one + TOTAL
  ══<══   Many + TOTAL
```

---

### 19.4 Full ER Analysis: Every Model

---

#### MODEL 1: USER (usermodel.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Super Keys (any combination that uniquely identifies):
  { _id }
  { email }
  { username }
  { googleId }
  { _id, email }
  { _id, email, username }   ... and many more

Candidate Keys (minimal super keys):
  { _id }         ← chosen as PRIMARY KEY
  { email }       ← ALTERNATE KEY
  { username }    ← ALTERNATE KEY
  { googleId }    ← ALTERNATE KEY (sparse — only for OAuth users)

Primary Key:       _id        [SK]  MongoDB ObjectId (surrogate)
Alternate Keys:    email      [NK]  Natural, has business meaning
                   username   [NK]  Natural, has business meaning
                   googleId   [NK]  Natural (from Google), sparse
Unique Keys:       email      [UK]  UNIQUE index in MongoDB
                   username   [UK]  UNIQUE index (sparse)
                   googleId   [UK]  UNIQUE index (sparse)
Foreign Keys:      connections[]     [FK] -> User (self)
                   pendingRequests[] [FK] -> User (self)
                   connectionRequests[] [FK] -> User (self)
                   blockedUsers[]    [FK] -> User (self)
Composite Keys:    None — all keys are simple (single field)
Simple Keys:       _id alone is sufficient → simple PK
Natural Keys:      email, username, googleId
Surrogate Key:     _id (ObjectId has no business meaning)
Partial Keys:      None (User is a strong entity)
─────────────────────────────────────────────────────────────

SELF-REFERENCING ER DIAGRAM (Unary/Recursive Relationships)

               ┌─────────────────────────────────┐
               │              USER               │
               │                                 │
               │  _id         [PK][SK]           │
               │  email       [AK][NK][UK]       │
               │  username    [AK][NK][UK]       │
               │  googleId    [AK][NK][UK]       │
               │  password                       │
               │  name                           │
               │  profilePicture                 │
               │  bio                            │
               │  jobTitle                       │
               │  company                        │
               │  skills[]                       │
               │  isOnline                       │
               │  isVerified                     │
               │  profileCompleted               │
               │  pushSubscription               │
               │  pushEnabled                    │
               │  resetPasswordToken             │
               │  resetPasswordExpires           │
               └────────────┬────────────────────┘
                            │
          ┌─────────────────┼──────────────────────┐
          │                 │                      │
          ▼                 ▼                      ▼
   ╔═════════════╗   ╔══════════════╗    ╔═══════════════════╗
   ║  CONNECTS   ║   ║   REQUESTS   ║    ║     BLOCKS        ║
   ║  TO (M:N)   ║   ║   (M:N)      ║    ║     (M:N)         ║
   ╚═════════════╝   ╚══════════════╝    ╚═══════════════════╝
          │                 │                      │
          │                 │                      │
          └─────────────────┴──────────────────────┘
                            │
                     [FK] -> User
                (Same entity — Unary/Recursive)

RELATIONSHIPS SUMMARY:
  User ─── connects with ──> User     M:N  Unary  Partial
  User ─── sends request to ─> User   M:N  Unary  Partial
  User ─── receives request ─> User   M:N  Unary  Partial
  User ─── blocks ──────────> User    M:N  Unary  Partial

PARTICIPATION:
  connections:       PARTIAL (a user may have 0 connections)
  pendingRequests:   PARTIAL (a user may not have sent any)
  connectionRequests:PARTIAL (others may not have requested)
  blockedUsers:      PARTIAL (a user may have blocked nobody)
```

---

#### MODEL 2: POST (Postmodel.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:    _id          [PK][SK]  MongoDB ObjectId
Alternate Keys: None (no other field uniquely identifies a post)
Foreign Keys:   createdBy    [FK] -> User   (required)
                likes[]      [FK] -> User   (array)
                bookmarks[]  [FK] -> User   (array)
                repostedFrom [FK] -> Post   (self-ref, optional)
                repostedBy[].user [FK] -> User
                poll.options[].votes[] [FK] -> User
                comments[].createdBy   [FK] -> User
Composite Keys: None at document level
                poll.options[].votes[] — {postId + optionIndex + userId}
                forms a composite natural key for a vote
Simple Key:     _id alone identifies uniquely
Natural Keys:   None — all meaningful fields are not unique
Surrogate Key:  _id
Partial Keys:   comments[] array elements (embedded weak entities)
                Each comment has no globally unique ID —
                only (postId + comment content + timestamp) together
─────────────────────────────────────────────────────────────

ER DIAGRAM

┌─────────────┐   CREATES    ╔═══════════════════════════════╗
│    USER     │══════════════║            POST               ║
│  _id [PK]   │  (1 : N)     ║  _id         [PK][SK]         ║
│             │  Total on    ║  createdBy   [FK]->User       ║
│             │  Post side   ║  content     String           ║
└─────────────┘              ║  imageUrl    String           ║
       │                     ║  videoUrl    String           ║
       │ LIKES (M:N)         ║  likes[]     [FK]->User       ║
       │ Partial both sides  ║  bookmarks[] [FK]->User       ║
       └────────────────────>║  reposts     Number           ║
       │ BOOKMARKS (M:N)     ║  repostedFrom[FK]->Post [opt] ║
       └────────────────────>║  postType    Enum             ║
                             ║  tags[]      String           ║
                             ║  poll        Object           ║
                             ║  metadata    Object           ║
                             ╚══════════════╦════════════════╝
                                            │
                                    REPOSTS (1:N)
                                    Self-reference (Unary)
                                    Partial (optional)
                                            │
                                            └──> Post (repostedFrom)

EMBEDDED WEAK ENTITY: Comment (inside Post)
  ╔══════════════════════════╗
  ║   EMBEDDED COMMENT       ║  ← Weak Entity (no global PK)
  ║  content     String      ║
  ║  createdBy   [FK]->User  ║  ← Partial Key component
  ║  hasGif      Boolean     ║  ← Partial Key component
  ║  createdAt   Date        ║  ← Partial Key component
  ╚══════════════════════════╝
  Identified by: (postId + createdBy + createdAt) = COMPOSITE PARTIAL KEY

RELATIONSHIPS:
  User ══════ creates ──────> Post    1:N  Binary  Total(Post) Partial(User)
  User ─────  likes ─────────> Post   M:N  Binary  Partial both
  User ─────  bookmarks ─────> Post   M:N  Binary  Partial both
  Post ─────  reposts from ──> Post   1:N  Unary   Partial (optional repost)
  User ══════ comments on ───> Post   M:N  Ternary Total(comment) Partial(User,Post)

PARTICIPATION:
  Post.createdBy:   TOTAL  (every Post MUST have an author)
  Post.likes:       PARTIAL (a post may have zero likes)
  Post.bookmarks:   PARTIAL (a post may have zero bookmarks)
  Post.repostedFrom:PARTIAL (only reposts have this — optional)
  User side:        PARTIAL (a user doesn't have to post)
```

---

#### MODEL 3: MESSAGE (messagemodel.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:    _id       [PK][SK]
Candidate Keys: { _id }   ← only one; no natural unique field
Foreign Keys:   sender    [FK] -> User   (required)
                receiver  [FK] -> User   (required)
                poll.options[].voters[] [FK] -> User
                event.organizer         [FK] -> User
                event.attendees[].userId [FK] -> User
                contacts[].id           [FK] -> User
                deletedFor[]            [FK] -> User
                reactions[].userId      [FK] -> User
Composite Keys: (sender + receiver + createdAt) forms a
                natural composite key for a specific message exchange
Partial Keys:   reactions[] elements — partial key = (userId + emoji)
                poll.options[] elements — partial key = (index + text)
─────────────────────────────────────────────────────────────

ER DIAGRAM

┌──────────────┐   SENDS     ╔════════════════════════════════╗
│    USER      │════════════>║            MESSAGE             ║
│  _id [PK]   │  (1:N)      ║  _id         [PK][SK]          ║
│             │  Total on   ║  sender      [FK]->User ══     ║
│             │  Message    ║  receiver    [FK]->User ══     ║
└──────┬───────┘  side      ║  messageType Enum              ║
       │                    ║  content     String            ║
       │ RECEIVES (1:N)     ║  audio       {url,duration}    ║
       └──────────────════> ║  image       {url,thumbnail}   ║
                            ║  video       {url,duration}    ║
                            ║  location    {lat,lon,live}    ║
                            ║  document    {url,name,size}   ║
                            ║  poll        {question,opts[]} ║
                            ║  event       {embedded event}  ║
                            ║  contacts[]  [FK]->User        ║
                            ║  isRead      Boolean           ║
                            ║  deletedFor[][FK]->User        ║
                            ║  reactions[] {userId,emoji}    ║
                            ╚════════════════════════════════╝

EMBEDDED WEAK ENTITIES:
  reactions[]  → Partial Key: (userId + emoji) — weak, no global _id
  poll.options[] → Partial Key: (index + text)

RELATIONSHIPS:
  User ══════ sends ═══════> Message    1:N  Binary  Total(Message) Partial(User)
  User ══════ receives ════> Message    1:N  Binary  Total(Message) Partial(User)
  User ─────  reacts to ──> Message    M:N  Binary  Partial both
  User ─────  deletes ────> Message    M:N  Binary  Partial both
  User ─────  votes in ───> Message.poll M:N Ternary Partial

PARTICIPATION:
  Message.sender:   TOTAL  (every message MUST have a sender)
  Message.receiver: TOTAL  (every message MUST have a receiver)
  Message.reactions:PARTIAL (a message may have zero reactions)
  Message.deletedFor:PARTIAL (a message may not be deleted by anyone)
  User sending:     PARTIAL (a user doesn't have to send messages)
```

---

#### MODEL 4: NOTIFICATION (notificationschema.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:    _id             [PK][SK]
Foreign Keys:   userId          [FK] -> User    (required)
                sender          [FK] -> User    (required)
                relatedEntity   [FK] -> Post OR Comment OR Message OR User
                                        POLYMORPHIC (refPath)
Composite Keys: None at document level
Natural Keys:   None (all meaningful attributes vary per notification)
Partial Keys:   None (Notification is a strong entity)

SPECIAL: Polymorphic FK
  relatedEntity + relatedEntityModel together form a
  BINARY COMPOSITE FK pointing to one of four collections.
  This is a TERNARY relationship in disguise:
  (Notification) relates to (User as recipient) AND
  (any entity as trigger) simultaneously.
─────────────────────────────────────────────────────────────

ER DIAGRAM

┌────────┐  TRIGGERS   ╔══════════════════════════════════╗
│  User  │═════════════║         NOTIFICATION             ║
│ (sndr) │  1:N Total  ║  _id             [PK][SK]        ║
└────────┘  on Notif   ║  userId          [FK]->User ══   ║
                       ║  sender          [FK]->User ══   ║
┌────────┐  RECEIVES   ║  relatedEntity   [FK]->(*)  ──   ║
│  User  │═════════════║  relatedEntityModel Enum         ║
│ (rcvr) │  1:N Total  ║  type            Enum            ║
└────────┘  on Notif   ║  status          Enum            ║
                       ║  priority        1|2|3            ║
┌────────┐  TRIGGERS   ║  actionUrl       String          ║
│  Post  │─────────────║  expiresAt       Date (TTL)      ║
└────────┘  (optional) ║  readAt          Date            ║
                       ╚══════════════════════════════════╝
┌────────┐
│Comment │─────────────(relatedEntity polymorphic link)
└────────┘
┌────────┐
│Message │─────────────(relatedEntity polymorphic link)
└────────┘

(*) = Post | Comment | Message | User (determined by relatedEntityModel)

RELATIONSHIPS:
  User (sender) ════ triggers ═════> Notification  1:N Binary Total(Notif)
  User (userId) ════ receives ════> Notification   1:N Binary Total(Notif)
  Post/Comment/Message/User ─ causes ─> Notification M:N Ternary Partial

PARTICIPATION:
  Notification.userId:       TOTAL  (must have recipient)
  Notification.sender:       TOTAL  (must have trigger actor)
  Notification.relatedEntity:PARTIAL (system notifications may have none)
  User receiving notif:      PARTIAL (user may have zero notifications)
```

---

#### MODEL 5: CONNECTION (connectionmodel.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:    _id                  [PK][SK]  Surrogate
Composite Unique Key:
                (senderId, receiverId) [CK][UK]
                This COMPOUND KEY ensures no duplicate requests.
                Neither senderId alone nor receiverId alone is unique.
                Only the COMBINATION is unique per pair.
Foreign Keys:   senderId   [FK] -> User  (required)
                receiverId [FK] -> User  (required)
Natural Keys:   (senderId + receiverId) has business meaning
                = "this specific pair has a pending request"
Alternate Key:  (senderId + receiverId) is an AK (candidate key)
                because it also uniquely identifies the connection
─────────────────────────────────────────────────────────────

ER DIAGRAM

┌─────────────┐                        ┌─────────────┐
│    USER     │                        │    USER     │
│  _id [PK]  │                        │  _id [PK]  │
│  (Sender)   │                        │ (Receiver)  │
└──────┬──────┘                        └──────┬──────┘
       │                                      │
       ║ Total on Connection side             ║ Total on Connection side
       ║                                      ║
       ╚══════════════╗   ╔═════════════════╝
                      ║   ║
              ╔═══════╩═══╩═══════════╗
              ║       CONNECTION      ║
              ║  _id       [PK][SK]   ║
              ║  senderId  [FK]->User ║  ← Component of [CK]
              ║  receiverId[FK]->User ║  ← Component of [CK]
              ║  (senderId+receiverId)[CK][UK][AK]
              ║  status    pending|connected
              ║  createdAt Date
              ╚═══════════════════════╝

COMPOSITE KEY DETAIL:
  UNIQUE INDEX: { senderId: 1, receiverId: 1 }
  This is a COMPOUND KEY — both fields together form the uniqueness constraint.
  senderId alone:   NOT unique (user can send many requests)
  receiverId alone: NOT unique (user can receive many requests)
  (senderId + receiverId): UNIQUE — only one request per ordered pair

RELATIONSHIPS:
  User (sender)   ══════ sends ════> Connection     1:N Binary Total(Connection)
  User (receiver) ══════ receives => Connection     1:N Binary Total(Connection)
  This is fundamentally a M:N relationship between User and User
  implemented as a separate entity (Connection document = junction table)

PARTICIPATION:
  Connection.senderId:   TOTAL  (connection MUST have sender)
  Connection.receiverId: TOTAL  (connection MUST have receiver)
  User as sender:        PARTIAL (user may have sent no requests)
  User as receiver:      PARTIAL (user may have received no requests)
```

---

#### MODEL 6: EDUCATION (educationModel.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:   _id      [PK][SK]  Surrogate ObjectId
Foreign Keys:  userId   [FK] -> User  (required)
Natural Keys:  (userId + collegeName + startDate)
               Together identify a specific degree uniquely
               but no unique index enforces this in MongoDB
Composite Key: (userId + collegeName + startDate) is a
               natural composite candidate key
Partial Keys:  None — Education is a strong entity with its own _id
─────────────────────────────────────────────────────────────

ER DIAGRAM

┌─────────────┐  STUDIES AT   ╔═══════════════════════════╗
│    USER     │───────────────║       EDUCATION           ║
│  _id [PK]  │  1 : N        ║  _id         [PK][SK]     ║
│             │  Partial(User)║  userId      [FK]->User ══║
│             │  Total(Edu)   ║  collegeName String req   ║
└─────────────┘               ║  degree      String req   ║
                              ║  fieldOfStudy String      ║
                              ║  startDate   Date req     ║
                              ║  endDate     Date         ║
                              ║  gpa         String       ║
                              ║  description String       ║
                              ║  skills      String       ║
                              ║  university  String       ║
                              ║  collegeType String       ║
                              ║  state       String       ║
                              ║  district    String       ║
                              ║  logo        String URL   ║
                              ║  createdAt   Date         ║
                              ╚═══════════════════════════╝

NATURAL COMPOSITE CANDIDATE KEY: (userId + collegeName + startDate)
  userId alone:      NOT unique (user has multiple degrees)
  collegeName alone: NOT unique (multiple users at same college)
  startDate alone:   NOT unique (many started same year)
  All three together: uniquely identify one education record

RELATIONSHIPS:
  User ─────── studies at ══> Education   1:N Binary Partial(User) Total(Edu)

PARTICIPATION:
  Education.userId: TOTAL  (every education record MUST belong to a user)
  User side:        PARTIAL (a user may have zero education entries)
```

---

#### MODEL 7: EXPERIENCE (experiencemodel.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:   _id      [PK][SK]
Foreign Keys:  userId   [FK] -> User (required)
Natural Composite Candidate Key:
               (userId + company + jobTitle + startDate)
               Together they uniquely identify one job experience
Partial Keys:  None — strong entity
─────────────────────────────────────────────────────────────

ER DIAGRAM

┌─────────────┐  WORKS AT   ╔════════════════════════════╗
│    USER     │═════════════║        EXPERIENCE          ║
│  _id [PK]  │  1 : N      ║  _id         [PK][SK]      ║
│             │  Total on   ║  userId      [FK]->User ══ ║
│             │  Exp side   ║  company     String req    ║
└─────────────┘             ║  jobTitle    String req    ║
                            ║  startDate   Date req      ║
                            ║  endDate     Date (null=now)║
                            ║  description String req    ║
                            ╚════════════════════════════╝

NATURAL COMPOSITE KEY: (userId + company + jobTitle + startDate)

RELATIONSHIPS:
  User ════════ works at ════> Experience  1:N Binary Partial(User) Total(Exp)

PARTICIPATION:
  Experience.userId: TOTAL  (must belong to a user)
  User side:         PARTIAL (user may have no experience listed)
```

---

#### MODEL 8: SKILL (skillmodel.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:   _id      [PK][SK]
Alternate Key: userId   [AK][NK]  — UNIQUE index enforces 1:1
               userId has business meaning AND is unique here.
               It is simultaneously a FK and AK.
Foreign Keys:  userId   [FK] -> User (required, UNIQUE)
Natural Keys:  userId (business meaning = "this user's skill set")
Composite Keys:
  skillLevels: { skillName: level } — Object map
  Each key-value pair forms a (userId + skillName) composite
  natural key for a specific skill level
Partial Keys:  skillLevels entries are partial keys of the Skill doc
               (skillName alone not unique globally)
─────────────────────────────────────────────────────────────

ER DIAGRAM — ONE-TO-ONE RELATIONSHIP

┌─────────────┐   HAS SKILLS   ╔══════════════════════════╗
│    USER     │════════════════║          SKILL           ║
│  _id [PK]  │    1 : 1       ║  _id         [PK][SK]    ║
│             │  Total on      ║  userId  [FK][AK][UK]->U ║
│             │  Skill side    ║  skills[]    [String]    ║
│             │  Partial on    ║  skillLevels {name:1-5}  ║
│             │  User side     ║  createdAt   Date        ║
└─────────────┘                ║  updatedAt   Date        ║
                               ╚══════════════════════════╝

ONE-TO-ONE: userId has UNIQUE index in Skill collection.
  ONE User -> ONE Skill document (user's complete skill set)
  This is the only true 1:1 relationship in this database.

RELATIONSHIPS:
  User ─────── has skills ════> Skill  1:1 Binary Partial(User) Total(Skill)

PARTICIPATION:
  Skill.userId:  TOTAL  (skill doc must belong to a user)
  User side:     PARTIAL (a user may not have added any skills yet)
```

---

#### MODEL 9: HACKATHON (Hackathonmodel.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:    _id      [PK][SK]
Alternate Keys: slug     [AK][NK]  UNIQUE — auto-generated from name
                         Has business meaning (URL-safe name)
                name     — NOT a key (two hackathons could have same name before slug generation)
Foreign Keys:   organizer         [FK] -> User (required)
                coOrganizers[]    [FK] -> User (array)
                participants[].user [FK] -> User
                prizes[].winners[] [FK] -> Team
Natural Keys:   slug (derived from name but URL-sanitised = business meaning)
Composite Keys:
  (hackathonId + userId) in participants[]
  = composite key for "this user's registration in this hackathon"
  participants[].user + hackathon._id = natural composite PK for registration
Partial Keys:   participants[] elements: partial key = userId
                (userId alone not unique globally; unique per hackathon)
                prizes[].winners[]: partial key = (prizeIndex + teamId)
                schedule[]:         partial key = (startTime + title)
─────────────────────────────────────────────────────────────

ER DIAGRAM

┌──────────┐ ORGANISES ╔═══════════════════════════════════════╗
│  USER    │═══════════║            HACKATHON                  ║
│ _id [PK] │  1:N      ║  _id         [PK][SK]                ║
│          │  Total    ║  slug        [AK][NK][UK]             ║
└──────────┘  on Hack  ║  organizer   [FK]->User ══            ║
                       ║  coOrganizers[][FK]->User             ║
┌──────────┐ CO-ORG    ║  name        String                   ║
│  USER    │───────────║  description String                   ║
│ _id [PK] │  M:N      ║  startDate   Date                    ║
└──────────┘  Partial  ║  endDate     Date                    ║
                       ║  registrationDeadline Date            ║
┌──────────┐ REGISTERS ║  timezone    String                   ║
│  USER    │───────────║  location    {type,address,coords}    ║
│ _id [PK] │  M:N      ║  tags[]      String                  ║
└──────────┘  Ternary  ║  maxTeamSize Number                  ║
    with               ║  status      Enum                     ║
 [STATUS field]        ║  participants[]{user->User,           ║
                       ║               registeredAt,           ║
                       ║               status:Enum}  ← Ternary ║
                       ║  prizes[]    {winners:[->Team]}       ║
                       ║  schedule[]  {embedded}               ║
                       ║  sponsors[]  {embedded}               ║
                       ╚═══════════════════════════════════════╝

TERNARY RELATIONSHIP: participants[]
  Three entities involved simultaneously:
  USER + HACKATHON + STATUS (registered|checked-in|submitted|winner)
  This is a TERNARY relationship expressed as an embedded array.

COMPOSITE KEY IN participants[]:
  (hackathon._id + participants[].user) = unique registration
  Neither alone is sufficient.

RELATIONSHIPS:
  User ════════ organises ════> Hackathon  1:N Binary Total(Hack) Partial(User)
  User ─────── co-organises ──> Hackathon  M:N Binary Partial both
  User ─────── registers in ──> Hackathon  M:N Ternary Partial(User+Hack)
  Team ─────── wins in ───────> Hackathon  M:N Binary Partial both

PARTICIPATION:
  Hackathon.organizer: TOTAL  (must have an organiser)
  User as organiser:   PARTIAL (a user may organise zero hackathons)
  User as participant: PARTIAL (user may not be registered)
```

---

#### MODEL 10: EVENT + VOTE + COMMENTEVENT

```
KEY ANALYSIS — EVENT
─────────────────────────────────────────────────────────────
Primary Key:   _id      [PK][SK]
Foreign Keys:  creator  [FK] -> User (required)
Natural Keys:  None (title + date not enforced unique)
Partial Keys:  None — strong entity
TTL Key:       expiresAt — special auto-delete index

KEY ANALYSIS — VOTE
─────────────────────────────────────────────────────────────
Primary Key:   _id      [PK][SK]
Composite Key: (user + event) [CK][UK]
               UNIQUE INDEX — prevents duplicate votes
               Neither user alone nor event alone is unique.
               The COMBINATION is a compound unique key.
Foreign Keys:  user   [FK] -> User  (required)
               event  [FK] -> Event (required)
Natural Keys:  (user + event) — has business meaning
Alternate Key: (user + event) — is an alternate candidate key

KEY ANALYSIS — COMMENTEVENT
─────────────────────────────────────────────────────────────
Primary Key:   _id     [PK][SK]
Foreign Keys:  author  [FK] -> User   (required)
               event   [FK] -> Event  (required)
               likes[] [FK] -> User   (array)
─────────────────────────────────────────────────────────────

ER DIAGRAM — TERNARY RELATIONSHIP

┌──────────┐                    ╔══════════════════════════╗
│  USER    │══ CREATES ════════>║         EVENT            ║
│ _id [PK] │   1:N  Total(E)   ║  _id       [PK][SK]      ║
└──────┬───┘                   ║  creator   [FK]->User ══  ║
       │                       ║  title     String req     ║
       │                       ║  description String req   ║
       │                       ║  date      Date req       ║
       │                       ║  time      String         ║
       │                       ║  location  String req     ║
       │ VOTES (Ternary)       ║  image     {public_id,url}║
       │ User + Event + Type   ║  expiresAt Date (TTL)     ║
       │                       ║  isTrending Boolean       ║
       └──────────────>╔════════╩══════════════╗           ║
                       ║       VOTE            ║           ║
                       ║ _id    [PK][SK]       ║           ║
                       ║ user   [FK]->User  ══ ║           ║
                       ║ event  [FK]->Event  ══║           ║
                       ║ (user+event) [CK][UK] ║           ║
                       ║ type   up|down        ║           ║
                       ║ createdAt Date        ║           ║
                       ╚═══════════════════════╝           ║
                                                           ║
       ┌──────────────────────────────────────────────────>║
       │ COMMENTS ON EVENT                                 ║
       │                                                   ╚
       └──────────>╔══════════════════════════╗
                   ║      COMMENTEVENT        ║
                   ║ _id     [PK][SK]         ║
                   ║ author  [FK]->User ══    ║
                   ║ event   [FK]->Event ══   ║
                   ║ content String req       ║
                   ║ likes[] [FK]->User       ║
                   ║ createdAt Date           ║
                   ╚══════════════════════════╝

VOTE COMPOSITE KEY DETAIL:
  UNIQUE INDEX: { user: 1, event: 1 }
  This is a COMPOSITE / COMPOUND KEY:
  user alone:  NOT unique (user can vote on many events)
  event alone: NOT unique (many users vote on same event)
  (user + event): UNIQUE — exactly one vote per user per event

RELATIONSHIPS:
  User ════════ creates ══════> Event         1:N Binary Total(Event) Partial(User)
  User ─────── votes on ─────> Event          M:N Ternary Partial (Vote is junction)
  User ─────── comments on ──> Event          M:N Binary Partial both
  User ─────── likes comment > CommentEvent   M:N Binary Partial both

PARTICIPATION:
  Event.creator:       TOTAL  (event must have creator)
  Vote.user:           TOTAL  (vote must have voter)
  Vote.event:          TOTAL  (vote must have target event)
  CommentEvent.author: TOTAL  (comment must have author)
  CommentEvent.event:  TOTAL  (comment must reference an event)
  User voting:         PARTIAL (user may not vote)
  User commenting:     PARTIAL (user may not comment)
```

---

#### MODEL 11: GROUP (groupmodel.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:   _id          [PK][SK]
Foreign Keys:  creator      [FK] -> User    (required)
               members[]    [FK] -> User    (array)
               lastMessage  [FK] -> Message (optional)
Natural Keys:  None (group name not unique)
Composite Keys:
  (creator + name) could be a natural composite candidate key
  (not enforced by index)
─────────────────────────────────────────────────────────────

ER DIAGRAM

┌──────────┐  CREATES  ╔══════════════════════════════╗
│  USER    │══════════>║            GROUP             ║
│ _id [PK] │  1:N      ║  _id        [PK][SK]         ║
└──────────┘  Total(G) ║  creator    [FK]->User ══    ║
                       ║  members[]  [FK]->User       ║
┌──────────┐  MEMBER   ║  name       String req       ║
│  USER    │──────────>║  image      String URL       ║
│ _id [PK] │  M:N      ║  lastMessage[FK]->Message    ║
└──────────┘  Partial  ║  createdAt  Date             ║
                       ║  updatedAt  Date             ║
┌──────────┐  LAST MSG ╚══════════════════════════════╝
│ MESSAGE  │──────────>(lastMessage FK back to Message)
│ _id [PK] │  1:1
└──────────┘  Optional

RELATIONSHIPS:
  User ════════ creates ════> Group    1:N Binary Total(Group) Partial(User)
  User ─────── is member ───> Group   M:N Binary Partial both
  Message ──── is latest ───> Group   1:1 Binary Partial(Group)

PARTICIPATION:
  Group.creator:     TOTAL  (group must have creator)
  Group.members:     PARTIAL (initially just creator; others join)
  Group.lastMessage: PARTIAL (new group has no messages yet)
  User as creator:   PARTIAL (user may create no groups)
  User as member:    PARTIAL (user may join no groups)
```

---

#### MODEL 12: ROOM (roommodel.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:   _id     [PK][SK]
Alternate Key: roomId  [AK][NK][UK]
               Has business meaning (human-readable room code)
               UNIQUE index enforced
Foreign Keys:  None at document level
               users[].userId is a String (raw), not ObjectId FK
               users[].socketId is a runtime value (no FK)
Natural Keys:  roomId (e.g., "abc-123" — meaningful to participants)
Surrogate Key: _id (MongoDB ObjectId, no business meaning)
Partial Keys:  users[] array elements — partial key = userId
               (userId alone not globally unique across all rooms)
               (socketId alone not globally unique)
─────────────────────────────────────────────────────────────

ER DIAGRAM

                   ╔════════════════════════════════╗
                   ║             ROOM               ║
                   ║  _id       [PK][SK]            ║
                   ║  roomId    [AK][NK][UK]        ║
                   ║  isActive  Boolean             ║
                   ║  iceServers [{urls,user,cred}] ║
                   ║  createdAt Date (TTL: 24h)     ║
                   ║                                ║
                   ║  EMBEDDED PARTICIPANTS:        ║
                   ║  users[] {                     ║
                   ║    userId      String [PaK]    ║
                   ║    username    String          ║
                   ║    socketId    String [PaK]    ║
                   ║    isMicOn     Boolean         ║
                   ║    isVideoOn   Boolean         ║
                   ║    isScreenSharing Boolean     ║
                   ║  }                             ║
                   ╚════════════════════════════════╝

PARTIAL KEYS IN users[]:
  userId alone:   identifies a user globally, but not their room membership
  socketId alone: identifies a socket session, changes on reconnect
  (roomId + userId) = composite natural key for "user in room"

NOTE: Room intentionally avoids ObjectId FKs for users because:
  1. Participants join/leave rapidly (real-time)
  2. Socket IDs are runtime values that don't persist
  3. The Room document is ephemeral (TTL: 24h)

RELATIONSHIPS:
  User ─────── joins ─────> Room    M:N Binary Partial both (runtime only)

PARTICIPATION:
  Room.users:   PARTIAL (a room may have 0 participants at any moment)
  User joining: PARTIAL (user may not be in any video call)
```

---

#### MODEL 13: RESUME (Resumemodel.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:   _id      [PK][SK]
Foreign Keys:  userId   — String type (raw, NOT ObjectId FK)
               This is intentional: Resume uses raw string userId
               because it was designed before FK ObjectId refs.
               Functional FK but not enforced by Mongoose.
Natural Keys:  None (fileName not unique; same user can upload many)
Composite Candidate Key: (userId + fileName + createdAt)
  Together identify one specific resume upload.
─────────────────────────────────────────────────────────────

ER DIAGRAM

┌──────────┐  UPLOADS   ╔══════════════════════════════════╗
│  USER    │───────────>║            RESUME                ║
│ _id [PK] │  1:N       ║  _id            [PK][SK]         ║
│          │  Partial   ║  userId         String (raw FK)  ║
└──────────┘  both      ║  fileName       String req       ║
                        ║  filePath       String req (URL) ║
                        ║  jobDescription String           ║
                        ║  analysisResult {                ║
                        ║    matchPercentage  0-100        ║
                        ║    atsScore         0-100        ║
                        ║    skillsMatch {                 ║
                        ║      Programming [String]        ║
                        ║      DataScience  [String]       ║
                        ║      DevOps       [String]       ║
                        ║    }                             ║
                        ║    recommendations [String]      ║
                        ║  }                               ║
                        ║  createdAt  Date                 ║
                        ║  updatedAt  Date                 ║
                        ╚══════════════════════════════════╝

RELATIONSHIPS:
  User ─────── uploads ─────> Resume  1:N Binary Partial both

PARTICIPATION:
  Resume.userId: TOTAL (functionally — every resume needs an owner)
  User side:     PARTIAL (user may upload no resumes)
```

---

#### MODEL 14: JOB (Jobsmodel.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:   _id      [PK][SK]
Foreign Keys:  None — Job is a standalone entity with no FK to User
Natural Keys:  None (Title + Company not enforced unique)
Composite Candidate Key: (Company + Title + Location)
  Could identify a specific job listing but not enforced.
─────────────────────────────────────────────────────────────

ER DIAGRAM

╔═══════════════════════════════════╗
║               JOB                ║   No FK to User.
║  _id          [PK][SK]           ║   Standalone entity.
║  Title        String req         ║
║  Description  String req         ║
║  Company      String req         ║
║  Location     String req         ║
║  Salary       String req         ║
║  Experience   String req         ║
║  Skills[]     String req         ║
║  Email        String req         ║
║  Phone        String             ║
║  Website      String             ║
║  Type         fulltime|part|...  ║
║  Requirements [String]           ║
║  createdAt    Date               ║
╚═══════════════════════════════════╝

NOTE: Job has NO FK relationships by design.
  Companies post jobs; the system doesn't tie jobs to specific user accounts.
  This is a design choice for a public job board.

RELATIONSHIPS: None (isolated entity)
PARTICIPATION: N/A
```

---

#### MODEL 15: SHORT VIDEO (shortmodel.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:   _id      [PK][SK]
Foreign Keys:  userId   — String (raw, not ObjectId FK)
Natural Keys:  None
Partial Keys:  comments[] elements: partial key = (userId + createdAt)
               likes[]: each element is a raw userId String (not ObjectId)
─────────────────────────────────────────────────────────────

ER DIAGRAM

┌──────────┐  UPLOADS  ╔══════════════════════════════╗
│  USER    │──────────>║          SHORT VIDEO         ║
│ _id [PK] │  1:N      ║  _id         [PK][SK]        ║
│          │  Partial  ║  userId      String (raw FK) ║
└──────────┘  both     ║  videoUrl    String (CDN)    ║
                       ║  caption     String          ║
                       ║  likes[]     [String]        ║
                       ║  dislikes[]  [String]        ║
                       ║  comments[]  {               ║
                       ║    userId    String [PaK]    ║
                       ║    text      String          ║
                       ║    createdAt Date   [PaK]    ║
                       ║  }                           ║
                       ║  shareCount  Number          ║
                       ║  createdAt   Date            ║
                       ╚══════════════════════════════╝

PARTIAL KEYS in comments[]:
  Each embedded comment is a WEAK ENTITY.
  Identified by: (short._id + userId + createdAt) = composite partial key

RELATIONSHIPS:
  User ─────── uploads ─────> Short    1:N Binary Partial both
  User ─────── likes ───────> Short    M:N Binary Partial both
  User ─────── comments on ─> Short    M:N Binary Partial both

PARTICIPATION:
  Short.userId: TOTAL (functionally, every video needs an owner)
  User side:    PARTIAL (user may upload no shorts)
```

---

#### MODEL 16: STATUS/STORY (statuseditmodel.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:   _id      [PK][SK]
Foreign Keys:  userId   — String (raw, not ObjectId FK)
Natural Keys:  None
Partial Keys:
  textElements[]:   partial key = id (local, not global)
  stickerElements[]:partial key = id (local, not global)
  likes[]:          partial key = userId (within this story)
  comments[]:       partial key = (userId + createdAt)
TTL Key:       createdAt — TTL: 86400s (auto-delete in 24h)
─────────────────────────────────────────────────────────────

ER DIAGRAM

┌──────────┐  CREATES  ╔════════════════════════════════════╗
│  USER    │──────────>║           STATUS / STORY           ║
│ _id [PK] │  1:N      ║  _id           [PK][SK]            ║
└──────────┘  Partial  ║  userId        String (raw FK)     ║
                       ║  name          String req          ║
                       ║  userProfilePic String             ║
                       ║  media[]       [String URLs]       ║
                       ║  textElements[]{id[PaK],text,      ║
                       ║                style,position}     ║
                       ║  stickerElements[]{id[PaK],url,    ║
                       ║                   position,size}   ║
                       ║  filter        {CSS filter obj}    ║
                       ║  music         {id,name,path}      ║
                       ║  likes[]       {userId[PaK],name}  ║
                       ║  comments[]    {userId[PaK],text}  ║
                       ║  createdAt     Date (TTL: 24h)     ║
                       ╚════════════════════════════════════╝

WEAK ENTITIES (embedded, partial keys):
  textElements:    Identified by local id field (not globally unique)
  stickerElements: Identified by local id field (not globally unique)
  likes:           Partial key = userId (unique per story, not globally)
  comments:        Partial key = (userId + createdAt)

RELATIONSHIPS:
  User ─────── posts ──────> Status   1:N Binary Partial both
  User ─────── likes ──────> Status   M:N Binary Partial both
  User ─────── comments on > Status   M:N Binary Partial both

PARTICIPATION:
  Status.userId: TOTAL (functionally, story needs owner)
  User side:     PARTIAL (user may post no stories)
  TTL:           Guaranteed deletion after 24 hours (enforced by MongoDB)
```

---

#### MODEL 17: POST IMPRESSION (PostImpression.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:   _id      [PK][SK]
Foreign Keys:  postId   [FK] -> Post  (required)
               userId   [FK] -> User  (required)
Natural Composite Candidate Key:
               (postId + userId + interactionType + timestamp)
               Together uniquely identify one interaction event
Composite Key: (postId + userId) identifies all impressions
               between a user and a post, but not uniquely
               (same user can view same post multiple times)
─────────────────────────────────────────────────────────────

ER DIAGRAM

┌──────────┐              ╔═══════════════════════════════════════╗
│  USER    │══════════════║         POST IMPRESSION               ║
│ _id [PK] │  Total on    ║  _id              [PK][SK]            ║
└──────────┘  Impression  ║  postId           [FK]->Post ══       ║
                          ║  userId           [FK]->User ══       ║
┌──────────┐              ║  sessionId        String              ║
│   POST   │══════════════║  interactionType  Enum                ║
│ _id [PK] │  Total on    ║  duration         Number (ms)         ║
└──────────┘  Impression  ║  interactionCount Number              ║
                          ║  isOrganic        Boolean             ║
                          ║  deviceType       mobile|desktop|tab  ║
                          ║  os               ios|android|...     ║
                          ║  browser          chrome|safari|...   ║
                          ║  screenResolution {width,height}      ║
                          ║  referrer         direct|search|...   ║
                          ║  referrerUrl      String              ║
                          ║  campaignId       String              ║
                          ║  utmSource/Medium/Campaign            ║
                          ║  ipAddress        String              ║
                          ║  country/region/city String           ║
                          ║  timestamp        Date (TTL)          ║
                          ║  lastInteractionAt Date               ║
                          ║                                       ║
                          ║  Virtual: engagementScore             ║
                          ║  (view=1,hover=2,scroll=3,click=5,    ║
                          ║   like=8,comment=10,save=12,share=15) ║
                          ╚═══════════════════════════════════════╝

TERNARY RELATIONSHIP:
  User + Post + InteractionType = PostImpression
  Three entities define each analytics event.

RELATIONSHIPS:
  User ══════ interacts with ══> PostImpression  1:N Binary Total(PI)
  Post ══════ is tracked by ═══> PostImpression  1:N Binary Total(PI)
  (User + Post) -> PostImpression is a TERNARY analytics relationship

PARTICIPATION:
  PostImpression.postId: TOTAL  (must reference a post)
  PostImpression.userId: TOTAL  (must reference a user)
  User side:             PARTIAL (user may not have any impressions)
  Post side:             PARTIAL (post may have no impressions yet)
```

---

#### MODEL 18: USERDETAILS (adddatamodel.js)

```
KEY ANALYSIS
─────────────────────────────────────────────────────────────
Primary Key:   _id      [PK][SK]
Foreign Keys:  userId   [FK] -> User
Natural Keys:  userId (has business meaning = "this user's extended profile")
               Unlike Skill, userId is NOT unique here
               (theoretically multiple docs per user possible,
               though application logic treats it as 1:1)
─────────────────────────────────────────────────────────────

ER DIAGRAM

┌──────────┐  HAS PROFILE  ╔══════════════════════════════════╗
│  USER    │──────────────>║          USERDETAILS             ║
│ _id [PK] │  1:1 logically║  _id            [PK][SK]         ║
└──────────┘  (1:N by      ║  userId         [FK]->User       ║
              schema)      ║  backgroundImage {public_id,url} ║
                           ║  socialLinks    {                ║
                           ║    linkedin, github,             ║
                           ║    instagram, facebook,          ║
                           ║    twitter, website,             ║
                           ║    youtube, medium, other        ║
                           ║  }                               ║
                           ║  interests      [String]         ║
                           ║  location       String           ║
                           ║  occupation     String           ║
                           ║  achievements   [String]         ║
                           ║  hobbies        [String]         ║
                           ║  createdAt/updatedAt             ║
                           ╚══════════════════════════════════╝

RELATIONSHIPS:
  User ─────── extends ─────> UserDetails  1:1 Binary Partial(User) Total(UD)

PARTICIPATION:
  UserDetails.userId: TOTAL (must belong to a user)
  User side:          PARTIAL (user may not have filled extended profile)
```

---

#### MODEL 19: TRENDING + PROFILE VIEW + STATS + VISITOR

```
KEY ANALYSIS — TRENDING TOPIC (Trendingmodel.js)
─────────────────────────────────────────────────────────────
Primary Key:   _id        [PK][SK]
Natural Keys:  title      — NOT unique (no index)
Foreign Keys:  None — standalone entity

KEY ANALYSIS — PROFILE VIEW (ProfileView.js)
─────────────────────────────────────────────────────────────
Primary Key:   _id         [PK][SK]
Foreign Keys:  profileId   — String (raw userId, no FK)
               viewerId    — String (raw userId, no FK)
Natural Composite Key: (profileId + viewerId + timestamp)
  Together identify one specific view event.
  (profileId + viewerId) alone is NOT unique — same user can
  view same profile multiple times.

KEY ANALYSIS — STATS (Stats.js)
─────────────────────────────────────────────────────────────
Primary Key:   _id   [PK][SK]
Special:       Single-document collection.
               Only one Stats document exists.
               _id is the PK but the collection is a singleton.

KEY ANALYSIS — VISITOR COUNT (VisitorCount.js)
─────────────────────────────────────────────────────────────
Primary Key:   _id      [PK][SK]
Natural Keys:  ip       — NOT unique (dynamic IPs change)
               deviceId — semi-unique (browser fingerprint)
Natural Composite Candidate Key: (ip + deviceId)
  Together identify one unique visitor more reliably.
─────────────────────────────────────────────────────────────

ER DIAGRAM

╔═══════════════════════╗        ╔══════════════════════════╗
║    TRENDING TOPIC     ║        ║      PROFILE VIEW        ║
║  _id     [PK][SK]     ║        ║  _id       [PK][SK]      ║
║  title   String req   ║        ║  profileId String(raw FK)║
║  description String   ║        ║  viewerId  String(raw FK)║
║  image   String URL   ║        ║  timestamp Date          ║
║  tags[]  String       ║        ╚══════════════════════════╝
║  popularity Number    ║
║  createdAt Date       ║        ╔══════════════════════════╗
╚═══════════════════════╝        ║         STATS            ║
                                 ║  _id     [PK][SK]        ║
                                 ║  totalVisitors Number    ║
                                 ║  (singleton document)    ║
                                 ╚══════════════════════════╝

                                 ╔══════════════════════════╗
                                 ║     VISITOR COUNT        ║
                                 ║  _id       [PK][SK]      ║
                                 ║  ip        String [NK]   ║
                                 ║  deviceId  String [NK]   ║
                                 ║  (ip+devId)[CK] natural  ║
                                 ║  firstVisit Date         ║
                                 ║  lastVisit  Date         ║
                                 ╚══════════════════════════╝

ProfileView NATURAL COMPOSITE KEY:
  (profileId + viewerId + timestamp) — uniquely identifies one view event
  (profileId + viewerId) alone NOT unique (can view same profile multiple times)

RELATIONSHIPS:
  TrendingTopic: No relationships (standalone, fed by external API)
  ProfileView:   Functional 1:N from User to ProfileView (not enforced by FK)
  Stats:         Singleton — no relationships
  VisitorCount:  Functional 1:1 from device to VisitorCount
```

---

### 19.5 Complete Relationship Matrix

```
┌─────────────────────┬──────────────┬──────────────┬──────────────┬──────────────────┐
│ Relationship        │ Type         │ Relationship │ Participation│ Implemented As   │
│                     │              │ Arity        │              │                  │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ User         │ M:N          │ Unary        │ Partial-Part │ [ObjectId] array │
│ (connections)       │              │ (Recursive)  │              │ in User doc      │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Post         │ 1:N          │ Binary       │ Part - Total │ createdBy FK     │
│ (creates)           │              │              │              │ in Post          │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Post         │ M:N          │ Binary       │ Part - Part  │ likes[] array    │
│ (likes)             │              │              │              │ in Post          │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Post         │ M:N          │ Binary       │ Part - Part  │ bookmarks[]      │
│ (bookmarks)         │              │              │              │ in Post          │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ Post ─ Post         │ 1:N          │ Unary        │ Part - Part  │ repostedFrom FK  │
│ (reposts)           │              │ (Recursive)  │              │ in Post (opt)    │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Message      │ 1:N          │ Binary       │ Part - Total │ sender FK        │
│ (sends)             │              │              │              │ in Message       │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Message      │ 1:N          │ Binary       │ Part - Total │ receiver FK      │
│ (receives)          │              │              │              │ in Message       │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Notification │ 1:N (rcvr)   │ Binary       │ Part - Total │ userId FK        │
│ (receives)          │ 1:N (sndr)   │              │              │ sender FK        │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User/Post/Comment/  │ 1:N          │ Binary       │ Part - Total │ relatedEntity    │
│ Message ─ Notif     │ (polymorphic)│              │              │ + refPath        │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ User         │ M:N          │ Binary       │ Part - Total │ Connection doc   │
│ (connection req)    │ (via Conn)   │              │              │ (junction table) │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Education    │ 1:N          │ Binary       │ Part - Total │ userId FK        │
│                     │              │              │              │ in Education     │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Experience   │ 1:N          │ Binary       │ Part - Total │ userId FK        │
│                     │              │              │              │ in Experience    │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Skill        │ 1:1          │ Binary       │ Part - Total │ userId FK UNIQUE │
│                     │              │              │              │ in Skill         │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Hackathon    │ 1:N (org)    │ Binary       │ Part - Total │ organizer FK     │
│ (organises)         │              │              │              │ in Hackathon     │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Hackathon    │ M:N          │ Ternary      │ Part - Part  │ participants[]   │
│ (registers + status)│ + Status     │              │              │ embedded array   │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Event        │ 1:N          │ Binary       │ Part - Total │ creator FK       │
│ (creates)           │              │              │              │ in Event         │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Event        │ M:N          │ Ternary      │ Part - Total │ Vote document    │
│ (votes on + type)   │ + VoteType   │              │              │ (junction)       │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Event        │ M:N          │ Binary       │ Part - Total │ CommentEvent doc │
│ (comments on)       │              │              │              │                  │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Group        │ 1:N (create) │ Binary       │ Part - Total │ creator FK       │
│                     │ M:N (member) │              │ Part - Part  │ members[] array  │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ Message ─ Group     │ 1:1 (latest) │ Binary       │ Part - Part  │ lastMessage FK   │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Resume       │ 1:N          │ Binary       │ Part - Total │ userId String    │
│                     │              │              │              │ (raw, no FK obj) │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User + Post ─ PI    │ M:N Ternary  │ Ternary      │ Part - Total │ PostImpression   │
│ (PostImpression)    │ + Interaction│              │              │ document         │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ UserDetails  │ 1:1 logically│ Binary       │ Part - Total │ userId FK        │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Short        │ 1:N          │ Binary       │ Part - Part  │ userId String    │
│                     │              │              │              │ (raw, no FK)     │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┤
│ User ─ Status       │ 1:N          │ Binary       │ Part - Part  │ userId String    │
│                     │              │              │              │ (raw, no FK)     │
└─────────────────────┴──────────────┴──────────────┴──────────────┴──────────────────┘
```

---

### 19.6 Key Type Summary Across All Models

```
┌─────────────────────┬─────────────────────────────────────────────────────────────┐
│ Key Type            │ Where Used in This Project                                  │
├─────────────────────┼─────────────────────────────────────────────────────────────┤
│ Primary Key [PK]    │ _id in EVERY model (22 models) — MongoDB ObjectId           │
├─────────────────────┼─────────────────────────────────────────────────────────────┤
│ Surrogate Key [SK]  │ _id in EVERY model — 12-byte random ObjectId,               │
│                     │ no business meaning                                          │
├─────────────────────┼─────────────────────────────────────────────────────────────┤
│ Natural Key [NK]    │ User.email, User.username, User.googleId                     │
│                     │ Hackathon.slug, Room.roomId, VisitorCount.ip+deviceId        │
├─────────────────────┼─────────────────────────────────────────────────────────────┤
│ Alternate Key [AK]  │ User.email (AK when _id is PK)                              │
│                     │ User.username (AK)                                           │
│                     │ User.googleId (AK, sparse)                                   │
│                     │ Hackathon.slug (AK)                                          │
│                     │ Room.roomId (AK)                                             │
│                     │ Skill.userId (AK + FK + UK — also uniquely identifies)      │
├─────────────────────┼─────────────────────────────────────────────────────────────┤
│ Unique Key [UK]     │ User.email, User.username, User.googleId                     │
│                     │ Hackathon.slug, Room.roomId, Skill.userId                    │
│                     │ Connection.(senderId+receiverId) [compound UK]                │
│                     │ Vote.(user+event) [compound UK]                              │
├─────────────────────┼─────────────────────────────────────────────────────────────┤
│ Foreign Key [FK]    │ 40+ FK fields across 18 models — see Section 8 table        │
├─────────────────────┼─────────────────────────────────────────────────────────────┤
│ Composite Key [CK]  │ Connection.(senderId + receiverId)                           │
│                     │ Vote.(user + event)                                          │
│                     │ Natural: Education.(userId + collegeName + startDate)        │
│                     │ Natural: Experience.(userId + company + jobTitle + startDate)│
│                     │ Natural: VisitorCount.(ip + deviceId)                        │
│                     │ Natural: ProfileView.(profileId + viewerId + timestamp)      │
├─────────────────────┼─────────────────────────────────────────────────────────────┤
│ Simple Key          │ All _id fields (single field PK)                             │
│                     │ All single-field FKs (sender, receiver, creator, etc.)       │
├─────────────────────┼─────────────────────────────────────────────────────────────┤
│ Partial Key [PaK]   │ Post.comments[].createdBy + createdAt (embedded weak entity) │
│                     │ Message.reactions[].userId + emoji                           │
│                     │ Message.poll.options[].index + text                          │
│                     │ Short.comments[].userId + createdAt                          │
│                     │ Status.textElements[].id (local id only)                     │
│                     │ Status.stickerElements[].id (local id only)                  │
│                     │ Room.users[].userId + socketId                               │
│                     │ Hackathon.participants[].user + registeredAt                 │
└─────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

### 19.7 Participation Constraints — All Relationships

```
LEGEND:
  ══ = Total Participation (mandatory — must exist)
  ── = Partial Participation (optional — may not exist)

  Entity A ── rel ══ Entity B
  means:
    A has PARTIAL participation (A may or may not have a B)
    B has TOTAL participation  (B MUST have an A)

┌────────────────────────────────────┬────────────────┬────────────────┐
│ Relationship                       │ Left Entity    │ Right Entity   │
│                                    │ Participation  │ Participation  │
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ── creates ══ Post            │ PARTIAL        │ TOTAL          │
│ (a user may post nothing;          │ (user doesn't  │ (post MUST     │
│  but every post needs author)      │  have to post) │  have author)  │
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ── likes ── Post              │ PARTIAL        │ PARTIAL        │
│ (user may like nothing;            │                │ (post may have │
│  post may have no likes)           │                │  no likes)     │
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ══ sends ══ Message           │ TOTAL          │ TOTAL          │
│ (every message MUST have           │ (functionally  │ (must have     │
│  sender and receiver)              │  total)        │  receiver)     │
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ── notified by ══ Notification│ PARTIAL        │ TOTAL          │
│ (user may have no notifs;          │ (user may have │ (notif MUST    │
│  every notif MUST have recipient)  │  no notifs)    │  have recipient)│
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ══ connects via ══ Connection │ TOTAL (both)   │ TOTAL (both)   │
│ (every Connection doc MUST have    │ (conn must     │ (conn must     │
│  both sender and receiver)         │  have sender)  │  have receiver)│
│ NOTE: User PARTIALLY participates  │ PARTIAL for    │ PARTIAL for    │
│ in the overall connection concept  │ User overall   │ User overall   │
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ── has ══ Education           │ PARTIAL        │ TOTAL          │
│ (user may have no education;       │                │ (edu must have │
│  every edu must have owner)        │                │  owner user)   │
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ── has ══ Experience          │ PARTIAL        │ TOTAL          │
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ── has ══ Skill               │ PARTIAL        │ TOTAL          │
│ (1:1 — user may not add skills;    │                │ (skill doc     │
│  skill doc must have owner)        │                │  must have user│
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ══ organises ══ Hackathon     │ PARTIAL        │ TOTAL          │
│ (user may not organise any;        │                │ (hackathon     │
│  hackathon MUST have organiser)    │                │  must have org)│
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ── registers ── Hackathon     │ PARTIAL        │ PARTIAL        │
│ (user may not register;            │                │ (hackathon may │
│  hackathon may have no registrants)│                │  have 0 people)│
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ══ creates ══ Event           │ PARTIAL        │ TOTAL          │
│ (user may not create events;       │                │ (event must    │
│  event MUST have creator)          │                │  have creator) │
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ══ votes via ══ Vote ══ Event │ TOTAL (Vote    │ TOTAL (Vote    │
│ (Vote doc MUST reference both      │  must have     │  must have     │
│  user and event)                   │  voter)        │  event)        │
│ User overall: PARTIAL              │                │                │
│ Event overall: PARTIAL             │                │                │
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ══ creates ══ Group           │ PARTIAL        │ TOTAL          │
│ (user may create no groups;        │                │ (group must    │
│  group MUST have creator)          │                │  have creator) │
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ── joins ── Group             │ PARTIAL        │ PARTIAL        │
│ (user may join no groups;          │                │ (group may     │
│  group may have few members)       │                │  have 1 member)│
├────────────────────────────────────┼────────────────┼────────────────┤
│ User+Post ══ tracked by ══ PI      │ TOTAL          │ TOTAL          │
│ (PostImpression MUST have          │ (PI must have  │ (PI must have  │
│  both user and post)               │  user)         │  post)         │
│ User overall: PARTIAL              │                │                │
│ Post overall: PARTIAL              │                │                │
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ── uploads ── Short           │ PARTIAL        │ PARTIAL        │
│ (user may not upload shorts)       │ (user may not) │ (functionally  │
│                                    │                │  total)        │
├────────────────────────────────────┼────────────────┼────────────────┤
│ User ── posts ── Status            │ PARTIAL        │ PARTIAL        │
│ (user may not post stories;        │                │ (functionally  │
│  stories auto-delete in 24h)       │                │  total)        │
└────────────────────────────────────┴────────────────┴────────────────┘
```

---

### 19.8 Identifying vs Non-Identifying Relationships

```
An IDENTIFYING relationship is one where the child entity CANNOT BE
UNIQUELY IDENTIFIED without its parent. (Child is a WEAK ENTITY)

A NON-IDENTIFYING relationship is one where the child has its own PK
and can be uniquely identified independently.

┌─────────────────────────────────────────┬─────────────────────────────┐
│ Identifying Relationships               │ Why                         │
│ (Weak Entities / Partial Keys)          │                             │
├─────────────────────────────────────────┼─────────────────────────────┤
│ Post.comments[] (embedded)              │ Comments have no global _id │
│                                         │ Identified by parent Post   │
├─────────────────────────────────────────┼─────────────────────────────┤
│ Message.reactions[] (embedded)          │ Reactions have no global _id│
├─────────────────────────────────────────┼─────────────────────────────┤
│ Message.poll.options[] (embedded)       │ Options identified by index │
├─────────────────────────────────────────┼─────────────────────────────┤
│ Status.textElements[] (embedded)        │ local id only, not global   │
├─────────────────────────────────────────┼─────────────────────────────┤
│ Status.stickerElements[] (embedded)     │ local id only, not global   │
├─────────────────────────────────────────┼─────────────────────────────┤
│ Short.comments[] (embedded)             │ No global _id               │
├─────────────────────────────────────────┼─────────────────────────────┤
│ Room.users[] (embedded)                 │ socketId is runtime value   │
├─────────────────────────────────────────┼─────────────────────────────┤
│ Hackathon.participants[] (embedded)     │ Identified by hackathon     │
├─────────────────────────────────────────┼─────────────────────────────┤
│ Hackathon.prizes[] (embedded)           │ Identified by hackathon     │
├─────────────────────────────────────────┼─────────────────────────────┤
│ Hackathon.schedule[] (embedded)         │ Identified by hackathon     │
├─────────────────────────────────────────┼─────────────────────────────┤
│ Hackathon.sponsors[] (embedded)         │ Identified by hackathon     │
├─────────────────────────────────────────┼─────────────────────────────┤
│ Hackathon.judgingCriteria[] (embedded)  │ Identified by hackathon     │
├─────────────────────────────────────────┼─────────────────────────────┤
│ Message.event.attendees[] (embedded)    │ Identified by message       │
└─────────────────────────────────────────┴─────────────────────────────┘

┌─────────────────────────────────────────┬─────────────────────────────┐
│ Non-Identifying Relationships           │ Why                         │
│ (Strong Entities with own PK)           │                             │
├─────────────────────────────────────────┼─────────────────────────────┤
│ All 22 top-level model relationships    │ Each has its own _id PK     │
│ User, Post, Message, Notification,      │ Can be identified without   │
│ Connection, Education, Experience,      │ knowing the parent          │
│ Skill, Group, Event, Hackathon, Room,   │                             │
│ Resume, Job, Short, Status, etc.        │                             │
└─────────────────────────────────────────┴─────────────────────────────┘
```

---

> **How to read this section as a student:**
>
> 1. Start with `§19.1` and `§19.2` to understand the theory
> 2. Then pick any model you're working with and read its individual ER diagram
> 3. Use `§19.5` (Relationship Matrix) to see how all models connect
> 4. Use `§19.6` (Key Summary) to find where each key type appears in practice
> 5. Use `§19.7` (Participation) to understand mandatory vs optional relationships
> 6. Use `§19.8` (Identifying vs Non-Identifying) to understand weak entities

---

## Quick Reference — Where Things Live

| I want to understand... | File to Read |
|---|---|
| How the server starts | server.js |
| How JWT tokens are created | service/authentication1.js |
| How cookies are verified | middleware/middleware.js |
| How Google OAuth works | routes/userroutes.js |
| How passwords are hashed | model/usermodel.js pre-save hook |
| User to Post relationship | model/Postmodel.js createdBy field |
| Polymorphic notifications | model/notificationschema.js refPath |
| Socket.IO messages | socket/socketnadle.js lines 155-246 |
| WebRTC signaling | socket/socketnadle.js join-meeting event |
| GraphQL schema | GraphQL/messageschema.js |
| Cloudinary upload | cloudinary.js + controller/shortController.js |
| Web push | service/webPushService.js |
| Post analytics | model/PostImpression.js |
| Structured logging | utils/logger.js |
| URL query pagination | utils/apiFeatures.js |
| TTL auto-delete | model/statuseditmodel.js |
| Skill normalisation | model/skillmodel.js pre-save hook |

---

> Built with love by [LinkiPax](https://github.com/LinkiPax) — Contributions welcome!
