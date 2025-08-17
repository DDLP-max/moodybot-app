import fs from "fs";
import path from "path";

export interface SystemPromptSection {
  id: string;
  title: string;
  content: string;
  priority: number;
}

export class SystemPromptManager {
  private static instance: SystemPromptManager;
  private systemPrompt: string = "";
  private lastModified: number = 0;
  private sections: SystemPromptSection[] = [];

  private constructor() {
    this.loadSystemPrompt();
  }

  public static getInstance(): SystemPromptManager {
    if (!SystemPromptManager.instance) {
      SystemPromptManager.instance = new SystemPromptManager();
    }
    return SystemPromptManager.instance;
  }

  /**
   * Loads the system prompt from markdown files and combines them
   */
  public loadSystemPrompt(): void {
    try {
      const promptDir = path.resolve("server/system_prompt");
      const sections: SystemPromptSection[] = [];

      // Check if the directory exists, if not, fall back to the old system_prompt.txt
      if (fs.existsSync(promptDir) && fs.statSync(promptDir).isDirectory()) {
        // Load from markdown files
        const files = fs.readdirSync(promptDir)
          .filter(file => file.endsWith('.md'))
          .sort(); // Sort to ensure consistent order

        for (const file of files) {
          const filePath = path.join(promptDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const section = this.parseMarkdownSection(file, content);
          if (section) {
            sections.push(section);
          }
        }

        // Sort sections by priority (lower numbers = higher priority)
        sections.sort((a, b) => a.priority - b.priority);

        // Combine sections
        this.systemPrompt = sections
          .map(section => `\n### ${section.title}\n\n${section.content}\n`)
          .join('\n---\n\n');

        this.sections = sections;
        console.log(`✅ Loaded system prompt from ${sections.length} markdown files`);
      } else {
        // Fallback to old system_prompt.txt
        const oldPromptPath = path.resolve("server/system_prompt.txt");
        if (fs.existsSync(oldPromptPath)) {
          this.systemPrompt = fs.readFileSync(oldPromptPath, "utf-8");
          console.log("✅ Loaded system prompt from system_prompt.txt (fallback)");
        } else {
          throw new Error("No system prompt files found");
        }
      }

      this.lastModified = Date.now();
    } catch (error) {
      console.error("❌ Failed to load system prompt:", error);
      // Set a minimal fallback prompt
      this.systemPrompt = `You are MoodyBot, an AI with a unique personality that combines emotional depth with brutal honesty. Always maintain your voice and character.`;
    }
  }

  /**
   * Parses a markdown file into a SystemPromptSection
   */
  private parseMarkdownSection(filename: string, content: string): SystemPromptSection | null {
    try {
      // Extract title from first heading
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : filename.replace('.md', '');

      // Determine priority based on filename prefix
      let priority = 1000; // Default priority
      const priorityMatch = filename.match(/^(\d+)_/);
      if (priorityMatch) {
        priority = parseInt(priorityMatch[1]);
      }

      // Special handling for mode router sections (highest priority)
      if (filename.includes('MODE_ROUTER') || filename.includes('COPYWRITER_BIAS') || filename.includes('OUTPUT_SCHEMAS')) {
        priority = 0;
      }

      return {
        id: filename.replace('.md', ''),
        title,
        content: content.trim(),
        priority
      };
    } catch (error) {
      console.error(`Failed to parse markdown section ${filename}:`, error);
      return null;
    }
  }

  /**
   * Gets the current system prompt
   */
  public getSystemPrompt(): string {
    return this.systemPrompt;
  }

  /**
   * Gets individual sections for editing
   */
  public getSections(): SystemPromptSection[] {
    return [...this.sections];
  }

  /**
   * Gets a specific section by ID
   */
  public getSection(id: string): SystemPromptSection | undefined {
    return this.sections.find(section => section.id === id);
  }

  /**
   * Updates a specific section
   */
  public updateSection(id: string, newContent: string): boolean {
    try {
      const section = this.sections.find(s => s.id === id);
      if (!section) {
        return false;
      }

      // Update the section content
      section.content = newContent;

      // Rebuild the system prompt
      this.systemPrompt = this.sections
        .sort((a, b) => a.priority - b.priority)
        .map(section => `\n### ${section.title}\n\n${section.content}\n`)
        .join('\n---\n\n');

      this.lastModified = Date.now();
      console.log(`✅ Updated section: ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update section ${id}:`, error);
      return false;
    }
  }

  /**
   * Adds a new section
   */
  public addSection(title: string, content: string, priority: number = 1000): string {
    try {
      const id = `custom_${Date.now()}`;
      const newSection: SystemPromptSection = {
        id,
        title,
        content,
        priority
      };

      this.sections.push(newSection);
      
      // Rebuild the system prompt
      this.systemPrompt = this.sections
        .sort((a, b) => a.priority - b.priority)
        .map(section => `\n### ${section.title}\n\n${section.content}\n`)
        .join('\n---\n\n');

      this.lastModified = Date.now();
      console.log(`✅ Added new section: ${id}`);
      return id;
    } catch (error) {
      console.error("❌ Failed to add new section:", error);
      throw error;
    }
  }

  /**
   * Removes a section
   */
  public removeSection(id: string): boolean {
    try {
      const index = this.sections.findIndex(s => s.id === id);
      if (index === -1) {
        return false;
      }

      this.sections.splice(index, 1);
      
      // Rebuild the system prompt
      this.systemPrompt = this.sections
        .sort((a, b) => a.priority - b.priority)
        .map(section => `\n### ${section.title}\n\n${section.content}\n`)
        .join('\n---\n\n');

      this.lastModified = Date.now();
      console.log(`✅ Removed section: ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove section ${id}:`, error);
      return false;
    }
  }

  /**
   * Reloads the system prompt from files
   */
  public reload(): void {
    console.log("🔄 Reloading system prompt...");
    this.loadSystemPrompt();
  }

  /**
   * Gets the last modified timestamp
   */
  public getLastModified(): number {
    return this.lastModified;
  }

  /**
   * Exports the current system prompt to a single file
   */
  public exportToFile(filepath: string): boolean {
    try {
      fs.writeFileSync(filepath, this.systemPrompt, 'utf-8');
      console.log(`✅ Exported system prompt to: ${filepath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to export system prompt:`, error);
      return false;
    }
  }

  /**
   * Gets system prompt statistics
   */
  public getStats(): {
    totalSections: number;
    totalLength: number;
    lastModified: number;
    source: 'markdown' | 'fallback'
  } {
    return {
      totalSections: this.sections.length,
      totalLength: this.systemPrompt.length,
      lastModified: this.lastModified,
      source: this.sections.length > 0 ? 'markdown' : 'fallback'
    };
  }
}

// Export a singleton instance
export const systemPromptManager = SystemPromptManager.getInstance();
