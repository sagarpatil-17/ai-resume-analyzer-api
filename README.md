# CVBoost AI — Backend

The backend API for **CVBoost AI**, an AI-powered resume analysis application. It provides the server-side foundation for processing application requests, coordinating resume analysis, and delivering results to the frontend.

## ✨ Responsibilities

- Handle frontend API requests
- Process resume analysis workflows
- Integrate with the configured AI provider
- Manage application data when a database is configured
- Validate incoming requests
- Handle errors and return structured API responses

## 🛠️ Tech Stack

Update this list to match the actual backend dependencies.

- Node.js
- TypeScript
- NestJS
- REST APIs
- Mongodb, prisma orm
- AI provider or model integration

## 📁 Project Structure

```text
├─ prisma
│  └─ schema.prisma
├─ src
│  ├─ auth
│  │  ├─ decorators
│  │  │  └─ current-user.decorator.ts
│  │  ├─ dto
│  │  │  ├─ login.dto.ts
│  │  │  └─ register.dto.ts
│  │  ├─ guards
│  │  │  └─ jwt-auth.guard.ts
│  │  ├─ strategies
│  │  │  └─ jwt.strategy.ts
│  │  ├─ auth.controller.ts
│  │  ├─ auth.module.ts
│  │  └─ auth.service.ts
│  ├─ prisma
│  │  ├─ prisma.module.ts
│  │  └─ prisma.service.ts
│  ├─ resume
│  │  ├─ dto
│  │  │  ├─ guest-chat.dto.ts
│  │  │  ├─ registered-chat.dto.ts
│  │  │  └─ resume-job.dto.ts
│  │  ├─ resume.controller.ts
│  │  ├─ resume.module.ts
│  │  └─ resume.service.ts
│  ├─ app.module.ts
│  └─ main.ts
├─ test
│  ├─ app.e2e-spec.ts
│  └─ jest-e2e.json
├─ .env (excluded)
├─ .gitignore (excluded)
├─ .oxlintrc.json (excluded)
├─ .prettierrc (excluded)
├─ jest.config.ts
├─ nest-cli.json
├─ package-lock.json
├─ package.json
├─ prisma.config.ts
├─ README.md
├─ tsconfig.build.json
├─ tsconfig.build.tsbuildinfo
└─ tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js
- npm

### Installation

```bash
git clone https://github.com/sagarpatil-17/ai-resume-analyzer.git
cd ai-resume-analyzer/backend
npm install
```

### Environment Variables

Create a `.env` file containing the configuration required by your backend.

Example placeholders:

```env
PORT=
JWT_SECRET_KEY=  
AI_API_KEY=
DATABASE_URL=
```

### Run the Server

Use the scripts defined in your `package.json`.

```bash
npm run dev
```

For a NestJS backend, your development command may instead be:

```bash
npm run start:dev
```

## 🔐 Security

- Validate request payloads on the server.
- Restrict allowed origins using appropriate CORS settings.
- Keep AI-provider keys and database credentials server-side.
- Apply file-type and file-size validation to resume uploads.
- Handle personal resume data securely.
- Avoid logging passwords, credentials, or unnecessary personal information.

## 🧪 Testing

Run the test scripts configured in your project.

```bash
npm test
```

Document the actual test framework and available test commands once verified.

## 👨‍💻 Author

**Sagar Patil**

- GitHub: [@sagarpatil-17](https://github.com/sagarpatil-17)
- Project: [CVBoost AI](https://github.com/sagarpatil-17/ai-resume-analyzer)

---

Part of the CVBoost AI project.
