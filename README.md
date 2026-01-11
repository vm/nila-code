<div align="center">

# 🤖 Coding Agent

**A smart AI assistant that can read, write, and execute code in your terminal**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=flat&logo=bun&logoColor=white)](https://bun.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

*Talk to your codebase in plain English. Build, debug, and manage projects through natural conversation.*

[Quick Start](#-quick-start) • [Features](#-what-can-it-do) • [Examples](#-example-session) • [Development](#-development)

---

</div>

## ✨ What can it do?

| Feature | Description |
|---------|-------------|
| 📁 **File Operations** | Read, edit, and create files with natural language commands |
| 🔧 **Command Execution** | Run shell commands and scripts safely |
| 📂 **Directory Navigation** | Explore and understand your project structure |
| 🎯 **Complex Tasks** | Handle multi-step workflows automatically |

**Just ask naturally:**
- *"Show me the package.json"*
- *"Add TypeScript to this project"*
- *"Install dependencies and start the dev server"*
- *"Create a login form with validation and tests"*

---

## ⚡ Quick Start

### Prerequisites

- **[Bun](https://bun.sh)** installed on your system
- **Anthropic API key** from [console.anthropic.com](https://console.anthropic.com/)

### Installation

```bash
# Clone the repository
git clone <this-repo>
cd coding-agent

# Install dependencies
bun install

# Set up your API key
echo "ANTHROPIC_API_KEY=your-key-here" > .env

# Start the agent
bun start
```

**That's it!** Navigate to any project folder and run `bun start` to begin.

---

## 💬 How It Works

The assistant follows a simple workflow:

```
┌─────────────────┐
│  You: Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Understand     │
│  Your Intent    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Read Relevant  │
│  Files          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Execute Actions│
│  (Edit/Run/etc) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Show Results   │
└─────────────────┘
```

### Example Requests

```
💭 "Create a React component for a todo list"
💭 "Fix the TypeScript errors in src/utils"  
💭 "Run the tests and show me what failed"
💭 "Add a new API endpoint for user registration"
```

---

## 🎮 Example Session

```
You: Create a simple Express server with a health check endpoint

🤖 I'll create an Express server for you...

📝 Created: server.js
🏃 Running: npm init -y
🏃 Running: npm install express
📝 Created: package.json scripts

✅ Done! Your server is ready. Run 'npm start' to launch it.
```

---

## 🛠 Development

### Running Tests

```bash
# Run all tests
bun test

# Watch mode for development
bun test --watch

# Generate coverage report
bun test --coverage
```

### Project Structure

```
coding-agent/
├── src/
│   ├── agent/          # Core agent logic
│   ├── components/     # React/Ink UI components
│   └── tools/          # Available tools/commands
├── tests/              # Test suite
└── package.json
```

---

## 🔧 Tech Stack

| Technology | Purpose |
|------------|---------|
| **TypeScript** | Type-safe development |
| **Bun** | Fast runtime & package manager |
| **Claude AI** | Intelligent code understanding |
| **React + Ink** | Beautiful terminal UI |

---

## 📋 Requirements

- ✅ Bun installed
- ✅ Anthropic API key
- ✅ That's it!

---

## 🤝 Contributing

Contributions are welcome! Found a bug or have an idea?

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ using TypeScript, Bun, and Claude AI**

[⬆ Back to Top](#-coding-agent)

</div>
