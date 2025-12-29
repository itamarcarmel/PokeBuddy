# 🎮 PokeBuddy - Your AI-Powered Pokémon Companion

> *"Gotta chat with 'em all!"* - Building an intelligent Pokémon assistant with NestJS, Groq LLM, and real-time data aggregation

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-red.svg)](https://nestjs.com/)
[![Jest](https://img.shields.io/badge/Tested%20with-Jest-green.svg)](https://jestjs.io/)
[![Groq](https://img.shields.io/badge/LLM-Groq%20(FREE)-orange.svg)](https://groq.com/)

Ever wanted to chat about Pokémon with an AI that actually *knows* what it's talking about? PokeBuddy combines the power of modern LLMs with real Pokémon data from multiple sources to give you accurate, intelligent responses about your favorite pocket monsters. Whether you're curious about Pikachu's stats, planning a competitive team, or just want to debate whether Charizard is actually that good (spoiler: it is), PokeBuddy has your back.

---

## 🌟 What Makes PokeBuddy Special?

### 🧠 **Intelligent Intent Classification**
PokeBuddy doesn't just throw your question at an LLM and hope for the best. It uses a two-stage AI pipeline:
1. **Intent Classifier**: Determines if you're asking about Pokémon, requesting a battle simulation, or just making small talk
2. **Data Aggregator**: Fetches relevant data from multiple sources (PokeAPI, PokedexAPI) with automatic failover
3. **Response Generator**: Combines real data with AI to craft accurate, contextual responses

### 🔄 **Multi-Source Data Aggregation**
Why trust one source when you can trust two? PokeBuddy aggregates data from multiple Pokémon APIs with weighted scoring:
- **PokeAPI** (weight: 1.0) - The gold standard
- **PokedexAPI** (weight: 0.8) - Reliable backup
- Automatic conflict resolution based on data confidence
- Graceful degradation if sources are unavailable

### 🎯 **Provider Abstraction Done Right**
Tired of being locked into a single LLM provider? PokeBuddy uses the Strategy + Factory pattern:
- **Groq Provider** (free, lightning-fast llama-3.1-8b-instant)
- **OpenRouter Provider** (100+ models, but requires credits)
- Switch providers with a single env var: `LLM_PROVIDER=groq`
- Add new providers without touching existing code

### 🐛 **Debug Mode That Actually Helps**
Ever wonder what your chatbot is doing behind the scenes? Enable debug mode to see:
- Which LLM provider and model were used
- Intent classification results (isPokemonRelated, isBattleSimulation)
- API calls with response times in milliseconds
- Processing timeline breakdown
- Total time from question to answer

```
🔍 Debug Information:
┌─────────────────────────────────────────────────┐
│ LLM Provider: Groq (llama-3.1-8b-instant)       │
│ Intent Classification:                          │
│   • Pokémon Related: Yes                        │
│   • Battle Simulation: No                       │
│   • Endpoints: pokemon, species                 │
│ Resources Used:                                 │
│   • PokeAPI (pokemon/pikachu) - 145ms          │
│   • PokeAPI (species/pikachu) - 89ms           │
│ Processing Timeline:                            │
│   • Classification: 423ms                       │
│   • API Fetch: 234ms                           │
│   • LLM Generation: 891ms                      │
│   • Total: 1,548ms                             │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (because we're living in the future)
- **FREE Groq API Key** (seriously, it's free and fast)
  - Sign up: https://console.groq.com/
  - Get key: https://console.groq.com/keys
  - No credit card needed!

### Installation

```bash
# Clone and install
git clone <your-repo-url>
cd PokeBuddy
npm install

# Configure your environment
cp .env.example .env
# Edit .env and add your Groq API key

# Build the project
npm run build

# Start chatting!
npm run cli:chat
```

### Your First Conversation

```bash
npm run cli:chat

You: Tell me about Pikachu
🤖 PokeBuddy: Pikachu is an Electric-type Pokémon known for its iconic 
lightning bolt-shaped tail and red cheeks that store electricity. It 
evolves from Pichu when leveled up with high friendship and can evolve 
into Raichu when exposed to a Thunder Stone...

You: What about in competitive battles?
🤖 PokeBuddy: Pikachu isn't typically used in competitive battles due to 
its low base stat total (320). However, Pikachu-holding Light Ball doubles 
its Attack and Special Attack, making it surprisingly viable in lower tiers...

You: exit
```

---

## 🏗️ Architecture: Under the Hood

PokeBuddy is built with enterprise-grade patterns while maintaining the agility of a startup. Here's how it all fits together:

### 🎯 **Domain-Driven Design**

```
src/
├── modules/
│   ├── chat/           # Chat domain (orchestration, sessions, conversations)
│   ├── llm/            # LLM abstraction (providers, factory)
│   ├── pokemon/        # Pokémon domain (aggregation, DTOs)
│   └── external-api/   # Knowledge sources (PokeAPI, PokedexAPI)
├── common/             # Shared utilities (errors, filters, interceptors)
├── config/             # Configuration management
└── database/           # Entities and migrations
```

### 🔄 **The Request Flow**

```
┌─────────────┐
│   CLI/API   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│        ChatService (Facade)             │
│  • Entry point for all chat requests    │
│  • Session management                   │
│  • Transaction coordination             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   ChatOrchestrationService              │
│  • Request routing                      │
│  • Context building                     │
│  • Response composition                 │
└──┬────────────────────────┬─────────────┘
   │                        │
   │ Classify Intent        │ Generate Response
   ▼                        ▼
┌──────────────────┐   ┌──────────────────┐
│ Intent Classifier│   │Response Generator│
│  • LLM-powered   │   │  • Context-aware │
│  • JSON output   │   │  • Data + AI     │
│  • High accuracy │   │  • Natural lang  │
└────────┬─────────┘   └────────┬─────────┘
         │                      │
         │ Fetch Data           │
         ▼                      │
┌──────────────────────────────▼┘
│   PokemonDataAggregator       │
│  • Multi-source fetching      │
│  • Weighted scoring           │
│  • Conflict resolution        │
└───┬──────────────────┬────────┘
    │                  │
    ▼                  ▼
┌─────────┐      ┌──────────┐
│ PokeAPI │      │PokedexAPI│
│(weight:1)│      │(weight:0.8)│
└─────────┘      └──────────┘
```

### 🎨 **Key Design Patterns**

#### 1. **Strategy Pattern** (LLM Providers)
```typescript
interface LlmProvider {
  generate(prompt: string): Promise<string>;
  checkConnection(): Promise<boolean>;
  getProviderName(): string;
}

class GroqProvider implements LlmProvider { /* ... */ }
class OpenRouterProvider implements LlmProvider { /* ... */ }
```

#### 2. **Factory Pattern** (Provider Selection)
```typescript
@Injectable()
export class LlmProviderFactory {
  createProvider(): LlmProvider {
    return this.config.llmProvider === 'groq' 
      ? this.groqProvider 
      : this.openRouterProvider;
  }
}
```

#### 3. **Facade Pattern** (Service Layer)
```typescript
@Injectable()
export class ChatService {
  // Simple API for complex operations
  async chat(dto: ChatDto): Promise<ChatResponse> {
    // Orchestrates: session, context, classification, data, generation
  }
}
```

#### 4. **Repository Pattern** (Data Access)
```typescript
@Injectable()
export class ChatSessionService {
  constructor(
    @InjectRepository(ChatSession) 
    private repo: Repository<ChatSession>
  ) {}
  
  async getChatSession(id: number): Promise<ChatSession> { /* ... */ }
}
```

### 🧩 **Module Boundaries**

Each module is independent and communicates through well-defined interfaces:

- **Chat Module**: Owns conversation flow, doesn't know about Pokémon
- **Pokémon Module**: Aggregates data, doesn't know about chat
- **LLM Module**: Provides AI, doesn't know about Pokémon or chat
- **External API Module**: Fetches data, doesn't know what it's for

This separation means you could theoretically swap Pokémon for any other domain (Star Wars, Marvel, etc.) without touching the chat engine.

---

## 🎮 Usage Guide

### CLI Commands

```bash
# Interactive chat (normal mode)
npm run cli:chat

# Interactive chat with debug mode
npm run cli:chat:debug

# Direct Pokemon lookup
npm run cli -- pokemon pikachu
npm run cli -- pokemon 25

# View chat history
npm run cli -- history
npm run cli -- history --limit 20

# Check LLM connection
npm run cli -- status
```

### 💬 **Real Usage Examples**

PokeBuddy showcases intelligent features that make chatting natural and forgiving:

#### **1. Basic Pokémon Query**
```
You: Tell me about Pikachu
🤖 PokeBuddy: Pikachu is an Electric-type Pokémon known for its iconic 
yellow appearance and lightning bolt-shaped tail. It has a base stat total 
of 320, with notable Special Attack (50) and Speed (90). Pikachu stores 
electricity in its red cheek pouches and can unleash powerful electric 
attacks like Thunderbolt. It evolves from Pichu with high friendship and 
evolves into Raichu when exposed to a Thunder Stone.
```

#### **2. Smart Spelling Correction**
The LLM automatically corrects typos and spelling mistakes:
```
You: tell me about ratata
🤖 PokeBuddy: I think you meant Rattata! Rattata is a Normal-type Pokémon 
with purple fur and large front teeth. It's known for being extremely 
common in the Kanto region and evolves into Raticate at level 20...
```

#### **3. Random Pokémon Discovery**
```
You: show me a random pokemon
🤖 PokeBuddy: Let me introduce you to Weezing! This Poison-type Pokémon 
has two heads and floats by filling its body with toxic gases. Weezing has 
a base stat total of 490 with high Defense (120) making it quite tanky. 
It's known for its Levitate ability which gives it immunity to Ground-type 
moves, despite its appearance...
```

#### **4. Battle Scenario Analysis**
```
You: who would win in a battle between charizard and blastoise?
🤖 PokeBuddy: This is a classic rivalry! Blastoise has a significant type 
advantage since Water is super effective against Fire/Flying types like 
Charizard. Blastoise's Water-type attacks (like Hydro Pump) would deal 4x 
damage to Charizard.

However, Charizard has higher Speed (100 vs 78) and Special Attack (109 vs 
85). If Charizard can land a Solar Beam (Grass-type), it could deal massive 
damage to Blastoise. 

In a typical battle: Blastoise wins 7/10 times due to type advantage, but 
Charizard can win with proper move selection and strategy.
```

#### **5. Contextual Follow-up Questions**
```
You: What's Charizard's best moveset?
🤖 PokeBuddy: For competitive battling, Charizard typically runs:
• Flamethrower / Fire Blast - STAB Fire attack
• Air Slash / Hurricane - STAB Flying attack  
• Solar Beam - Coverage against Water/Rock types
• Roost - Healing to increase longevity

With its Mega Evolution forms (X and Y), the moveset changes significantly...

You: What about for casual playthroughs?
🤖 PokeBuddy: For in-game playthroughs, I'd recommend a simpler set:
• Flamethrower - Reliable Fire STAB
• Fly - Transportation + Flying STAB
• Dragon Claw - Great coverage move
• Earthquake / Brick Break - Coverage for Rock types
```

### REST API

Start the server:
```bash
npm run start:dev
```

Endpoints:
```bash
# Chat endpoint
POST http://localhost:3001/api/chat
Content-Type: application/json

{
  "message": "Tell me about Charizard",
  "chatSessionId": 1,
  "debug": true
}

# Pokemon endpoints
GET http://localhost:3001/api/pokemon/pikachu
GET http://localhost:3001/api/pokemon/25
GET http://localhost:3001/api/pokemon/search?limit=20
```

### Configuration

Environment variables (`.env`):
```env
# Server
NODE_ENV=development
PORT=3001

# LLM Provider Selection
LLM_PROVIDER=groq  # or "openrouter"

# Groq (FREE and FAST)
GROQ_API_KEY=gsk_your_key_here
GROQ_API_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.1-8b-instant

# OpenRouter (100+ models, requires credits)
OPENROUTER_API_KEY=sk_your_key_here
OPENROUTER_API_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free
OPENROUTER_APP_NAME=PokeBuddy

# Database
DATABASE_PATH=data/pokebuddy.sqlite
```

---

## 🧪 Testing

PokeBuddy includes comprehensive unit tests using Jest and NestJS TestBed:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov

# Debug tests
npm run test:debug
```

**Test Results:**
- ✅ 8 test suites, 17 tests passing
- ✅ ~28% code coverage (focused on critical services)
- ✅ All major services covered: Config, LLM, Chat, Pokemon, External APIs

**Tested Components:**
- `AppConfigService` - Configuration loading
- `LlmService` - LLM facade
- `GroqProvider` - Groq integration
- `ChatService` - Chat orchestration
- `MessageIntentClassifierService` - Intent classification
- `PokemonDataAggregator` - Multi-source aggregation
- `PokeApiKnowledgeSource` - PokeAPI integration

---

## 🚧 Roadmap: What's Next?

PokeBuddy is production-ready for personal use, but there's always room for improvement. Here's what we're thinking about:

### 🎯 **High Priority**

#### **1. API Response Caching**
*Current:* Every request hits external APIs (PokeAPI, PokedexAPI)  
*Goal:* Implement Redis/in-memory cache with TTL  
*Why:* Reduce latency, respect rate limits, improve UX  
*Effort:* Medium (2-3 days)

```typescript
// Proposed implementation
@Injectable()
export class CacheService {
  async get<T>(key: string): Promise<T | null>;
  async set<T>(key: string, value: T, ttl: number): Promise<void>;
  async invalidate(pattern: string): Promise<void>;
}
```

#### **2. Decouple Pokémon Domain**
*Current:* Pokémon knowledge is somewhat coupled to chat logic  
*Goal:* Complete domain independence - make chat engine reusable  
*Why:* Enable multi-domain support (Star Wars, Marvel, etc.)  
*Effort:* Large (5-7 days)

```typescript
// Proposed architecture
interface DomainKnowledgeSource<T> {
  fetchData(query: string): Promise<T>;
  getSourceName(): string;
}

// Works with ANY domain
class DataAggregator<T> {
  constructor(private sources: DomainKnowledgeSource<T>[]) {}
}
```

### 🔄 **Medium Priority**

#### **3. WebSocket Support**
*Current:* REST API only  
*Goal:* Real-time bidirectional communication  
*Why:* Better UX for streaming responses, typing indicators  
*Note:* Most modern chat apps (Discord, Slack, ChatGPT) use WebSockets for real-time feel  
*Effort:* Medium (3-4 days)

```typescript
// Proposed implementation
@WebSocketGateway()
export class ChatGateway {
  @SubscribeMessage('chat')
  async handleChat(@MessageBody() dto: ChatDto) {
    // Stream LLM response in chunks
    for await (const chunk of this.llm.generateStream(prompt)) {
      this.server.emit('chatChunk', chunk);
    }
  }
}
```

#### **4. Plugin Architecture**
*Current:* Providers and knowledge sources hardcoded  
*Goal:* Dynamic plugin loading at runtime  
*Why:* Add new LLMs or APIs without code changes  
*Effort:* Large (7-10 days)

```typescript
// Proposed plugin system
interface Plugin {
  name: string;
  version: string;
  init(config: PluginConfig): Promise<void>;
}

@Injectable()
export class PluginRegistry {
  async loadPlugin(path: string): Promise<Plugin>;
  async registerProvider(plugin: LlmProviderPlugin): Promise<void>;
}
```

### 📊 **Testing & Quality**

#### **5. Integration Tests**
*Current:* Unit tests only (17 tests)  
*Goal:* E2E tests for critical flows  
*Coverage:*
  - Chat flow (question → classification → data → response)
  - Provider failover (Groq fails → OpenRouter fallback)
  - Multi-source aggregation (PokeAPI + PokedexAPI)
*Effort:* Medium (3-4 days)

#### **6. E2E CLI Tests**
*Current:* Manual CLI testing  
*Goal:* Automated CLI interaction tests  
*Why:* Catch regressions in user-facing interface  
*Effort:* Small (1-2 days)

### ️ **Infrastructure**

#### **7. Docker Compose Setup**
*Goal:* One-command deployment with all dependencies  
*Effort:* Small (1 day)

#### **8. GitHub Actions CI/CD**
*Goal:* Automated testing, building, deployment  
*Effort:* Small (1-2 days)

---

## 💡 Technical Decisions & Trade-offs

### Why NestJS?
- **Dependency Injection**: Makes testing and mocking trivial
- **Modular Architecture**: Clean separation of concerns
- **TypeScript-first**: Type safety = fewer runtime bugs
- **Enterprise-ready**: Scales from hobby to production

### Why Groq?
- **Free tier**: No credit card, generous limits
- **Speed**: 500+ tokens/second on llama-3.1-8b-instant
- **Quality**: Surprisingly good for free model
- **OpenAI-compatible API**: Easy to swap providers

### Why SQLite?
- **Zero config**: Works out of the box
- **Portable**: Single file database
- **Fast enough**: For personal/small team use
- **Easy to upgrade**: Can migrate to Postgres later

### Why Multiple Knowledge Sources?
- **Reliability**: Failover if PokeAPI is down
- **Data quality**: Cross-reference for accuracy
- **Completeness**: Fill gaps from different sources

---

## 🤝 Contributing

Found a bug? Have a feature idea? Want to add a new LLM provider?

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/awesome-thing`)
3. Make your changes
4. Write tests if applicable
5. Submit a PR with a clear description

**Good first issues:**
- Add new LLM provider (Claude, Gemini, etc.)
- Add new Pokémon API source
- Improve test coverage
- Add more CLI commands

---

## 📝 License

MIT - Do whatever you want with it!

---

## 🙏 Acknowledgments

- **PokeAPI** - The amazing free Pokémon API
- **Groq** - For the incredible free LLM tier
- **NestJS Team** - For the awesome framework
- **Game Freak & Nintendo** - For creating Pokémon

---

## 📞 Questions?

Open an issue or start a discussion! I'm always happy to help or chat about:
- Architecture decisions
- NestJS patterns
- LLM integration
- Pokémon (of course)

---

*Built with ❤️ and way too much caffeine*

*"It's not about catching them all, it's about understanding them all"* 🎯
