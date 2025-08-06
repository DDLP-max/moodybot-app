import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Plus, Image, X, Upload } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface Message {
  role: string;
  content: string;
  image?: string; // Base64 image data
  imageDescription?: string; // AI-generated description of the image
}

interface Command {
  name: string;
  command: string;
  style: 'primary' | 'accent' | 'gradient';
}

interface CommandCategory {
  title: string;
  commands: Command[];
}

const allCommands: CommandCategory[] = [
  {
    title: "🔥 Core Emotional & Savage Modes",
    commands: [
      { name: "/savage", command: "/savage", style: "gradient" },
      { name: "/roast", command: "/roast", style: "gradient" },
      { name: "/cut", command: "/cut", style: "gradient" },
      { name: "/bomb", command: "/bomb", style: "gradient" },
      { name: "/cia", command: "/cia", style: "gradient" },
    ],
  },
  {
    title: "💔 Reflective & Supportive Modes",
    commands: [
      { name: "/velvet", command: "/velvet", style: "gradient" },
      { name: "/validate", command: "/validate", style: "gradient" },
      { name: "/mirror", command: "/mirror", style: "gradient" },
      { name: "/float", command: "/float", style: "gradient" },
      { name: "/noir", command: "/noir", style: "gradient" },
      { name: "/clinical", command: "/clinical", style: "gradient" },
    ],
  },
  {
    title: "🧠 Cognitive Expansion / Longform Modes",
    commands: [
      { name: "/discuss", command: "/discuss", style: "gradient" },
      { name: "/thoughts", command: "/thoughts", style: "gradient" },
    ],
  },
  {
    title: "🎭 Persona-Based Roleplay Modes",
    commands: [
      { name: "/mentor", command: "/mentor", style: "gradient" },
      { name: "/ex", command: "/ex", style: "gradient" },
      { name: "/godfather", command: "/godfather", style: "gradient" },
      { name: "/agent", command: "/agent", style: "gradient" },
      { name: "/hobo", command: "/hobo", style: "gradient" },
      { name: "/rollins", command: "/rollins", style: "gradient" },
      { name: "/munger", command: "/munger", style: "gradient" },
    ],
  },
  {
    title: "🧨 Structural Interventions",
    commands: [
      { name: "/contrast", command: "/contrast", style: "gradient" },
      { name: "/audit", command: "/audit", style: "gradient" },
      { name: "/intervene", command: "/intervene", style: "gradient" },
    ],
  },
  {
    title: "🎬 Cultural Review Mode",
    commands: [
      { name: "/rate", command: "/rate", style: "gradient" },
    ],
  },
  {
    title: "👑 Archetype Mode",
    commands: [
      { name: "/villain", command: "/villain", style: "gradient" },
    ],
  },
  {
    title: "🔺 Triangle & Spiral Analysis",
    commands: [
      { name: "/triangulate", command: "/triangulate", style: "gradient" },
      { name: "/drama", command: "/drama", style: "gradient" },
      { name: "/iron", command: "/iron", style: "gradient" },
      { name: "/sadness", command: "/sadness", style: "gradient" },
      { name: "/cbt or /spiral", command: "/cbt", style: "gradient" },
      { name: "/dark", command: "/dark", style: "gradient" },
    ],
  },
  {
    title: "✍️ Style / Voice Injection",
    commands: [
      { name: "/moodyfy", command: "/moodyfy", style: "gradient" },
    ],
  },
  {
    title: "🛞 Chaos Crash Mode",
    commands: [
      { name: "/dale-yolo", command: "/dale-yolo", style: "gradient" },
    ],
  },
];

export default function Chat() {
  const [location, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [currentSession, setCurrentSession] = useState<{ mode: string; sessionId: number; userId: number } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentMode, setCurrentMode] = useState<string>("savage");
  // TODO: Re-enable when OpenRouter supports vision models
  // const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // TODO: Re-enable when OpenRouter supports vision models
  // const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsInitializing(true);
        console.log("Starting session initialization...");
        
        // First, try to create a default user if it doesn't exist
        let userId = 1;
        try {
          console.log("Attempting to create/get user...");
          const userResponse = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "moodybot_user",
              password: "default_password"
            }),
          });
          
          console.log("User response status:", userResponse.status);
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log("User created/found:", userData);
            userId = userData.id;
          } else {
            console.error("Failed to create user, status:", userResponse.status);
            const errorText = await userResponse.text();
            console.error("User creation error:", errorText);
          }
        } catch (error) {
          console.error("Error creating/getting user:", error);
        }

        // Create a new session
        console.log("Creating new session with userId:", userId);
        const newSessionResponse = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: userId,
            mode: "savage",
            title: "New Chat"
          }),
        });
        
        console.log("Session response status:", newSessionResponse.status);
        
        if (newSessionResponse.ok) {
          const sessionData = await newSessionResponse.json();
          console.log("Session created successfully:", sessionData);
          setCurrentSession({
            sessionId: sessionData.id, // Use 'id' from backend response
            userId: sessionData.userId,
            mode: sessionData.mode
          });
          setCurrentMode(sessionData.mode);
        } else {
          console.error("Failed to create new session, status:", newSessionResponse.status);
          const errorText = await newSessionResponse.text();
          console.error("Session creation error:", errorText);
          // Set a fallback session for testing
          setCurrentSession({
            sessionId: 1,
            userId: userId,
            mode: "savage"
          });
          setCurrentMode("savage");
        }
      } catch (error) {
        console.error("Error during session initialization:", error);
        // Set a fallback session for testing
        setCurrentSession({
          sessionId: 1,
          userId: 1,
          mode: "savage"
        });
        setCurrentMode("savage");
      } finally {
        console.log("Session initialization complete");
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, []);

  // TODO: Re-enable when OpenRouter supports vision models
  // Handle paste events for images
  // useEffect(() => {
  //   const handlePaste = (e: ClipboardEvent) => {
  //     const items = e.clipboardData?.items;
  //     if (!items) return;

  //     for (let i = 0; i < items.length; i++) {
  //       if (items[i].type.indexOf('image') !== -1) {
  //         const file = items[i].getAsFile();
  //         if (file) {
  //           handleImageFile(file);
  //         }
  //         break;
  //       }
  //     }
  //   };

  //   document.addEventListener('paste', handlePaste);
  //   return () => document.removeEventListener('paste', handlePaste);
  // }, []);

  // TODO: Re-enable when OpenRouter supports vision models
  // const handleImageFile = (file: File) => {
  //   if (!file.type.startsWith('image/')) {
  //     alert('Please select an image file');
  //     return;
  //   }

  //   // Compress the image before converting to base64
  //   const compressImage = (file: File): Promise<string> => {
  //     return new Promise((resolve) => {
  //       const canvas = document.createElement('canvas');
  //       const ctx = canvas.getContext('2d');
  //       const img = new window.Image();
  //       
  //       img.onload = () => {
  //         // Calculate new dimensions (max 800px width/height)
  //         const maxSize = 800;
  //         let { width, height } = img;
  //           
  //         if (width > height) {
  //           if (width > maxSize) {
  //             height = (height * maxSize) / width;
  //             width = maxSize;
  //           }
  //         } else {
  //           if (height > maxSize) {
  //             width = (width * maxSize) / height;
  //             height = maxSize;
  //           }
  //         }
  //           
  //         canvas.width = width;
  //         canvas.height = height;
  //           
  //         // Draw and compress
  //         ctx?.drawImage(img, 0, 0, width, height);
  //           
  //         // Convert to base64 with compression
  //         const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
  //         resolve(compressedDataUrl);
  //       };
  //       
  //       img.src = URL.createObjectURL(file);
  //     });
  //   };

  //   // Compress and set the image
  //   compressImage(file).then((compressedImage) => {
  //     console.log('Original file size:', file.size, 'bytes');
  //     console.log('Compressed image size:', compressedImage.length, 'bytes');
  //     setSelectedImage(compressedImage);
  //   });
  // };

  // TODO: Re-enable when OpenRouter supports vision models
  // const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     handleImageFile(file);
  //   }
  // };

  // TODO: Re-enable when OpenRouter supports vision models
  // const handleDragOver = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   setIsDragOver(true);
  // };

  // const handleDragLeave = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   setIsDragOver(false);
  // };

  // const handleDrop = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   setIsDragOver(false);
  //   
  //   const files = e.dataTransfer.files;
  //   if (files.length > 0) {
  //     handleImageFile(files[0]);
  //   }
  // };

  // TODO: Re-enable when OpenRouter supports vision models
  // const removeImage = () => {
  //   setSelectedImage(null);
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = '';
  //   }
  // };

  const sendMessageMutation = useMutation({
    mutationFn: async (newMessage: string) => {
      if (!currentSession) {
        throw new Error("Chat session not initialized.");
      }

      console.log("Sending message:", { 
        message: newMessage
        // TODO: Re-enable when OpenRouter supports vision models
        // hasImage: !!selectedImage, 
        // imageSize: selectedImage ? selectedImage.length : 0 
      });

      const requestBody = {
        sessionId: currentSession.sessionId,
        userId: currentSession.userId,
        role: "user",
        content: newMessage,
        // TODO: Re-enable when OpenRouter supports vision models
        // image: selectedImage, // Include image data
      };

      console.log("Request body size:", JSON.stringify(requestBody).length);

      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
        console.error("API Error:", errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to send message`);
      }

      const data = await response.json();
      console.log("Response data:", data);
      
      // Update the current mode based on the response
      if (data.selectedMode) {
        setCurrentMode(data.selectedMode);
      }
      
      // Check if we got a proper AI response
      if (data.aiMessage && data.aiMessage.content) {
        return data.aiMessage.content;
      } else if (data.aiReply) {
        return data.aiReply;
      } else {
        console.error("No AI response found in data:", data);
        return "MoodyBot is thinking...";
      }
    },
    onSuccess: (aiReply) => {
      console.log("Message sent successfully:", aiReply);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiReply },
      ]);
      // TODO: Re-enable when OpenRouter supports vision models
      // Clear the image after sending
      // setSelectedImage(null);
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      // Don't add error message to chat if it's already there
      const errorMessage = error.message.includes("MoodyBot has gone quiet") 
        ? "MoodyBot is thinking... Please try again in a moment."
        : `Error: ${error.message}`;
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.content === errorMessage) {
          return prev; // Don't add duplicate error
        }
        return [...prev, { role: "assistant", content: errorMessage }];
      });
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim()) return; // Removed image check since images are disabled
    if (sendMessageMutation.isPending || isInitializing) return;

    const userMessage = { 
      role: "user", 
      content: message,
      // TODO: Re-enable when OpenRouter supports vision models
      // image: selectedImage || undefined
    };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    try {
      // Send the message (images disabled)
      await sendMessageMutation.mutateAsync(message);
    } catch (error) {
      // Error handled by onError in useMutation
    }
  };

  const addCommandToInput = (command: string) => {
    setMessage((prev) => prev + command + " "); // Add space after command
  };

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Setting the stage...</p>
          <p className="text-xs text-muted-foreground mt-2">Preparing your cinematic experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary/20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="text-center">
          <a 
            href="https://moodybot.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 mb-1 hover:opacity-80 transition-opacity"
          >
            <Eye className="text-primary text-xl" />
            <span className="font-black text-lg gradient-text">MoodyBot</span>
            </a>
          <div className="flex items-center justify-center space-x-2">
            <p className="text-sm text-muted-foreground">
              Mode: {currentMode === "savage" ? "auto" : currentMode}
            </p>
            {currentMode === "savage" && (
              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">
                Auto-selected
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Powered by Claude-3.5-Sonnet via OpenRouter • Full Cinematic Experience
          </p>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-primary"
          onClick={() => {
            setMessages([]);
            window.location.reload();
          }}
          title="Refresh chat"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Command Bar - Grid Layout */}
      <div className="p-3 border-b border-primary/20 bg-surface/50">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {allCommands.flatMap(category => 
            category.commands.map((cmd) => (
              <Button
                key={cmd.command}
                variant="outline"
                size="sm"
                className="text-xs px-2 py-1 h-auto rounded-full whitespace-nowrap bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:opacity-80"
                onClick={() => addCommandToInput(cmd.command)}
              >
                {cmd.name}
              </Button>
            ))
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <AnimatePresence>
          {messages.map((message, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`max-w-lg mb-4 px-5 py-3 rounded-2xl shadow-lg bg-white text-black ${
                message.role === "user" ? "ml-auto" : "mr-auto"
              }`}
              style={{ wordBreak: "break-word" }}
            >
              {/* TODO: Re-enable when OpenRouter supports vision models */}
              {/* {message.image && (
                <div className="mb-3">
                  <img 
                    src={message.image} 
                    alt="Uploaded content" 
                    className="max-w-full h-auto rounded-lg"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )} */}
              {message.content}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* TODO: Re-enable when OpenRouter supports vision models */}
      {/* Image Upload Area */}
      {/* {selectedImage && (
        <div className="p-4 border-t border-primary/20 bg-surface/30">
          <div className="flex items-center space-x-3">
            <img 
              src={selectedImage} 
              alt="Selected" 
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Image uploads disabled</p>
              <p className="text-xs text-muted-foreground">Image functionality temporarily unavailable</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={removeImage}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )} */}

      {/* Input Area */}
      <div className="p-4 border-t border-primary/20 bg-surface/50">
        <div 
          className="flex items-center space-x-2"
          // TODO: Re-enable when OpenRouter supports vision models
          // className={`flex items-center space-x-2 ${
          //   isDragOver ? 'border-2 border-dashed border-primary rounded-lg p-2' : ''
          // }`}
          // onDragOver={handleDragOver}
          // onDragLeave={handleDragLeave}
          // onDrop={handleDrop}
        >
          <input
            type="text"
            placeholder="Begin your cinematic journey... Share your story, your pain, your truth"
            className="flex-1 p-3 rounded-full bg-background border border-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            disabled={sendMessageMutation.isPending || isInitializing}
          />
          
          {/* Image Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            // onChange={handleFileSelect}
            className="hidden"
            disabled={true}
          />
          <Button
            variant="ghost"
            size="icon"
            // onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-primary opacity-50"
            disabled={true}
            title="Image uploads temporarily disabled"
          >
            <Image className="h-5 w-5" />
          </Button>
          
          <Button
            onClick={handleSendMessage}
            className="rounded-full px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={sendMessageMutation.isPending || isInitializing}
          >
            {sendMessageMutation.isPending ? "Crafting..." : "Begin Journey"}
          </Button>
        </div>
        
        {/* Cinematic Experience Instructions */}
        <div className="mt-2 text-center">
          <p className="text-xs text-muted-foreground">
            🎬 Cinematic Mode: Each response is crafted for emotional depth and atmospheric storytelling
          </p>
        </div>
      </div>
    </div>
  );
}
