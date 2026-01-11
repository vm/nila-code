# Nila Code 🤖

A powerful CLI-based coding assistant powered by Claude (Anthropic) that can read, edit, and create files, list directories, and run shell commands. Built with TypeScript, React (Ink), and Bun for a blazingly fast development experience.

## ✨ Features

- 🔧 **File Operations** - Read, edit, create, and manage files with natural language
- 📁 **Directory Navigation** - List and browse directory contents
- ⚡ **Command Execution** - Run shell commands and scripts
- 💬 **Conversational Interface** - Maintains context across multiple interactions
- 🔍 **Tool Visibility** - Real-time feedback on executed operations
- 📊 **Token Usage Tracking** - Monitor API usage with detailed statistics
- 🎨 **Beautiful Terminal UI** - Clean, responsive interface built with React Ink
- 🧪 **Test-Driven Development** - Comprehensive test coverage for reliability

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) installed on your system
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd nila-code
   bun install
   ```

2. **Set up your API key:**
   ```bash
   # Create .env file
   echo "ANTHROPIC_API_KEY=your-api-key-here" > .env
   ```

3. **Start coding:**
   ```bash
   # Navigate to your project
   cd /path/to/your/project
   
   # Start Nila Code
   bun start
   ```

## 💡 Usage Examples

### 🗂️ File Operations
```
"Create a React component called Button in src/components/"
"Read the tsconfig.json file and show me the compiler options"
"Update package.json to add lodash as a dependency"
"Delete all .log files in the current directory"
```

### ⚙️ Development Tasks
```
"Set up a new Express.js project with TypeScript"
"Run the tests and show me the results"
"Build the project and check for any errors"
"Create a Dockerfile for this Node.js app"
```

### 🔧 System Operations
```
"Show me the git status and recent commits"
"Install dependencies and start the development server"
"Find all TODO comments in TypeScript files"
"Check the disk usage of this directory"
```

### 🏗️ Multi-step Workflows
```
"Create a new feature branch, add a login component, and run tests"
"Refactor the user service to use async/await, then update the tests"
"Generate API documentation and deploy to GitHub Pages"
```

## 📖 User Interface

When you start Nila Code, you'll see:

- **Header**: Shows current working directory and quick examples
- **Messages**: Your conversation with the assistant
- **Tool Calls**: Real-time display of operations being performed
- **Token Usage**: API usage statistics (input/output tokens)
- **Input**: Type your requests in natural language

### 🎛️ Controls
- **Enter**: Send message
- **Ctrl+C**: Exit application
- **↑/↓**: Navigate command history (if implemented)

## 🛠️ Development

### Running Tests
```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test src/tools/read-file.test.ts
```

### Project Structure
```
src/
├── agent/          # Core agent logic and types
├── components/     # React Ink UI components
├── tools/          # File system and command tools
└── index.tsx       # Application entry point
```

### Available Scripts
- `bun start` - Start the application
- `bun test` - Run test suite
- `bun test --watch` - Run tests in watch mode

## 🏗️ Architecture

### Tech Stack
- **🟦 TypeScript** - Type safety and developer experience
- **⚛️ React + Ink** - Component-based terminal UI
- **🥖 Bun** - Fast runtime, bundler, and test runner
- **🧠 Claude (Anthropic)** - Advanced AI reasoning capabilities

### Core Components

#### Agent (`src/agent/`)
- Manages conversation flow and tool orchestration
- Handles Claude API communication
- Maintains conversation context and history

#### Tools (`src/tools/`)
- **read_file** - Read file contents
- **edit_file** - Edit files or create new ones
- **list_files** - Browse directories
- **run_command** - Execute shell commands

#### UI Components (`src/components/`)
- **App** - Main application container
- **Message** - Chat message display
- **ToolCall** - Tool execution visualization
- **Input** - Command input interface

## 🔒 Environment Variables

Create a `.env` file in the project root:

```env
# Required: Your Anthropic API key
ANTHROPIC_API_KEY=your-api-key-here

# Optional: Override default model
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `bun test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines
- Write tests for new features
- Follow TypeScript best practices
- Use descriptive commit messages
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- 🐛 **Issues**: Report bugs or request features
- 💬 **Discussions**: Ask questions or share ideas
- 📧 **Contact**: [your-email@example.com]

## 🎯 Roadmap

- [ ] Plugin system for custom tools
- [ ] Multi-language support
- [ ] Integration with popular IDEs
- [ ] Cloud sync for conversation history
- [ ] Advanced file search and filtering
- [ ] Git integration improvements
- [ ] Performance optimizations

---

**Made with ❤️ using Claude, TypeScript, and Bun**
