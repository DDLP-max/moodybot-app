#!/usr/bin/env python3
"""
MoodyBot Project Detector
Automatically detects and switches between projects in the MoodyBot workspace
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, Optional, List

class MoodyBotProjectDetector:
    def __init__(self, workspace_root: str = None):
        self.workspace_root = Path(workspace_root or os.getcwd())
        self.config_file = self.workspace_root / ".vscode" / "settings.json"
        self.config = self._load_config()
    
    def _load_config(self) -> Dict:
        """Load workspace configuration"""
        try:
            with open(self.config_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"❌ Workspace config not found: {self.config_file}")
            return {}
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON in workspace config: {self.config_file}")
            return {}
    
    def get_project_info(self, project_key: str) -> Optional[Dict]:
        """Get information about a specific project"""
        if not self.config or 'moodybot.workspace' not in self.config:
            return None
        
        projects = self.config['moodybot.workspace'].get('projects', {})
        return projects.get(project_key)
    
    def detect_project_from_context(self, context: str) -> Optional[str]:
        """Detect which project based on context keywords"""
        if not self.config or 'moodybot.workspace' not in self.config:
            return None
        
        context_lower = context.lower()
        project_detection = self.config['moodybot.workspace'].get('projectDetection', {})
        context_keywords = project_detection.get('contextKeywords', {})
        
        # Score each project based on keyword matches
        project_scores = {}
        for project_key, keywords in context_keywords.items():
            score = 0
            for keyword in keywords:
                if keyword.lower() in context_lower:
                    score += 1
            if score > 0:
                project_scores[project_key] = score
        
        # Return the project with the highest score
        if project_scores:
            best_project = max(project_scores.items(), key=lambda x: x[1])
            return best_project[0]
        
        return None
    
    def list_projects(self) -> List[Dict]:
        """List all available projects"""
        if not self.config or 'moodybot.workspace' not in self.config:
            return []
        
        projects = self.config['moodybot.workspace'].get('projects', {})
        return [
            {
                'key': key,
                'name': info.get('name', 'Unknown'),
                'type': info.get('type', 'Unknown'),
                'technology': info.get('technology', 'Unknown'),
                'description': info.get('description', 'No description'),
                'path': info.get('path', 'Unknown')
            }
            for key, info in projects.items()
        ]
    
    def get_project_path(self, project_key: str) -> Optional[Path]:
        """Get the absolute path to a project"""
        project_info = self.get_project_info(project_key)
        if not project_info:
            return None
        
        path_str = project_info.get('path', '')
        if path_str.startswith('C:/'):
            # Handle absolute paths (like replit)
            return Path(path_str)
        else:
            # Handle relative paths
            return self.workspace_root / path_str.lstrip('./')
    
    def validate_project_structure(self) -> Dict[str, bool]:
        """Validate that all projects exist and have expected structure"""
        results = {}
        
        for project_key in self.config.get('moodybot.workspace', {}).get('projects', {}):
            project_path = self.get_project_path(project_key)
            if project_path and project_path.exists():
                results[project_key] = True
            else:
                results[project_key] = False
        
        return results

def main():
    """Main function for command-line usage"""
    detector = MoodyBotProjectDetector()
    
    if len(sys.argv) < 2:
        print("🔍 MoodyBot Project Detector")
        print("=" * 40)
        print("Usage:")
        print("  python project-detector.py list                    # List all projects")
        print("  python project-detector.py detect <context>       # Detect project from context")
        print("  python project-detector.py info <project>         # Get project info")
        print("  python project-detector.py path <project>         # Get project path")
        print("  python project-detector.py validate               # Validate project structure")
        return
    
    command = sys.argv[1]
    
    if command == "list":
        projects = detector.list_projects()
        print("📋 Available Projects:")
        print("=" * 40)
        for project in projects:
            print(f"🔑 Key: {project['key']}")
            print(f"📝 Name: {project['name']}")
            print(f"🏗️  Type: {project['type']}")
            print(f"⚙️  Tech: {project['technology']}")
            print(f"📁 Path: {project['path']}")
            print(f"📖 Description: {project['description']}")
            print("-" * 40)
    
    elif command == "detect" and len(sys.argv) > 2:
        context = " ".join(sys.argv[2:])
        project = detector.detect_project_from_context(context)
        if project:
            print(f"🎯 Detected project: {project}")
            project_info = detector.get_project_info(project)
            if project_info:
                print(f"📝 Name: {project_info.get('name', 'Unknown')}")
                print(f"📁 Path: {project_info.get('path', 'Unknown')}")
        else:
            print("❓ Could not detect project from context")
    
    elif command == "info" and len(sys.argv) > 2:
        project_key = sys.argv[2]
        project_info = detector.get_project_info(project_key)
        if project_info:
            print(f"📋 Project Info for '{project_key}':")
            print("=" * 40)
            for key, value in project_info.items():
                print(f"{key}: {value}")
        else:
            print(f"❌ Project '{project_key}' not found")
    
    elif command == "path" and len(sys.argv) > 2:
        project_key = sys.argv[2]
        project_path = detector.get_project_path(project_key)
        if project_path:
            print(f"📁 Project path: {project_path}")
        else:
            print(f"❌ Project '{project_key}' not found")
    
    elif command == "validate":
        results = detector.validate_project_structure()
        print("🔍 Project Structure Validation:")
        print("=" * 40)
        for project, exists in results.items():
            status = "✅" if exists else "❌"
            print(f"{status} {project}: {'Exists' if exists else 'Missing'}")
    
    else:
        print("❌ Invalid command or missing arguments")
        print("Use 'python project-detector.py' for help")

if __name__ == "__main__":
    main()
