# MoodyBot Workspace Configuration

This workspace contains multiple MoodyBot-related projects. The configuration files in this directory help automatically detect and switch between projects.

## 🏗️ **Project Structure**

### **moodybot-webapp** (Default Project)
- **Type**: Web Application
- **Technology**: TypeScript/React/Express
- **Purpose**: Main web application for MoodyBot AI chatbot
- **Entry Point**: `server/index.ts`
- **Commands**: `npm run dev`, `npm run build`
- **Location**: External workspace (`C:/Users/marin/OneDrive/Documents/moodybot-webapp`)

### **moodybot-crawler**
- **Type**: Data Crawler
- **Technology**: Python
- **Purpose**: Python crawler for analyzing public forum complaints and identifying opportunities
- **Entry Point**: `enhanced_launcher.py`
- **Commands**: `python enhanced_launcher.py`

### **quiz**
- **Type**: Web Application
- **Technology**: Python/Flask
- **Purpose**: Flask-based quiz application with interactive questions
- **Entry Point**: `app.py`
- **Commands**: `python app.py`

### **website**
- **Type**: Static Website
- **Technology**: HTML/CSS/JavaScript
- **Purpose**: Static website for MoodyBot with HTML, CSS, and JavaScript
- **Entry Point**: `index.html`
- **Commands**: `open index.html`

### **cl** (Craigslist Automation)
- **Type**: Automation
- **Technology**: Python/Selenium
- **Purpose**: Python automation for Craigslist using Selenium WebDriver
- **Entry Point**: `cl.py`
- **Commands**: `python cl.py`

### **replit** (Telegram Bot)
- **Type**: Telegram Bot
- **Technology**: Python/Flask/Telegram
- **Purpose**: Python Telegram bot for MoodyBot with Flask backend and dynamic persona engine
- **Entry Point**: `main.py`
- **Commands**: `python main.py`
- **Location**: External workspace (`C:/Users/marin/OneDrive/Documents/SIR/moodybot/replit`)

## 🔍 **Automatic Project Detection**

The workspace automatically detects which project you're referring to based on keywords:

### **Webapp Keywords**
- `web`, `app`, `server`, `api`, `chatbot`, `typescript`, `react`, `express`, `webapp`, `web-app`

### **Crawler Keywords**
- `crawler`, `crawl`, `python`, `data`, `twitter`, `reddit`, `quora`, `scraping`, `analysis`, `social`, `media`

### **Quiz Keywords**
- `quiz`, `flask`, `questions`, `assessment`, `interactive`, `test`

### **Website Keywords**
- `website`, `static`, `html`, `css`, `javascript`, `landing`, `frontend`

### **CL Keywords**
- `craigslist`, `cl`, `automation`, `selenium`, `webdriver`, `chrome`, `scraping`

### **Replit Keywords**
- `replit`, `telegram`, `bot`, `flask`, `persona`, `dynamic`, `ai`, `chatbot`

## 🚀 **Usage Examples**

### **When you say:**
- **"Let's work on the webapp"** → Automatically switches to `moodybot-webapp`
- **"Let's work on the crawler"** → Automatically switches to `moodybot-crawler`
- **"Let's work on the quiz"** → Automatically switches to `quiz`
- **"Let's work on the website"** → Automatically switches to `website`
- **"Let's work on the CL project"** → Automatically switches to `CL`
- **"Let's work on the replit bot"** → Automatically switches to `replit`
- **"Let's work on the Telegram bot"** → Automatically detects `replit`
- **"Let's work on the Python project"** → Automatically detects `moodybot-crawler`, `quiz`, `CL`, or `replit`
- **"Let's work on the server"** → Automatically detects `moodybot-webapp`

### **Project Detection Script**
```bash
# List all projects
python .vscode/project-detector.py list

# Detect project from context
python .vscode/project-detector.py detect "python crawler twitter"
python .vscode/project-detector.py detect "flask quiz questions"
python .vscode/project-detector.py detect "static html website"
python .vscode/project-detector.py detect "telegram bot replit"

# Get project info
python .vscode/project-detector.py info crawler
python .vscode/project-detector.py info quiz
python .vscode/project-detector.py info replit

# Get project path
python .vscode/project-detector.py path webapp
python .vscode/project-detector.py path cl
python .vscode/project-detector.py path replit

# Validate project structure
python .vscode/project-detector.py validate
```

## ⚙️ **Configuration Files**

- **`.vscode/settings.json`**: Main workspace configuration
- **`.vscode/project-detector.py`**: Python script for project detection
- **`Moodybot.code-workspace`**: VS Code workspace file

## 🔧 **Customization**

You can modify the configuration in `.vscode/settings.json` to:
- Add new projects
- Change project keywords
- Modify project paths
- Add project-specific settings

## 📝 **Adding New Projects**

To add a new project, edit `.vscode/settings.json` and add a new entry under `projects`:

```json
"newproject": {
  "name": "New Project Name",
  "path": "./new-project-path",
  "type": "project-type",
  "technology": "tech-stack",
  "description": "Project description",
  "keywords": ["keyword1", "keyword2"]
}
```

## 🎯 **Benefits**

1. **Automatic Context Switching**: No need to manually navigate between projects
2. **Clear Project Boundaries**: Each project has defined paths and settings
3. **Intelligent Detection**: AI automatically knows which project you're referring to
4. **Consistent Structure**: All projects follow the same configuration pattern
5. **Easy Navigation**: Quick access to project-specific files and commands
6. **Multi-Technology Support**: Handles TypeScript, Python, HTML/CSS, and more
7. **External Project Support**: Can include projects from different workspace locations
8. **Multi-Workspace Integration**: Seamlessly works with projects across different directories
