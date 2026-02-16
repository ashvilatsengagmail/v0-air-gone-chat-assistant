"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, History, Globe, Leaf, Sun, Bug, Droplets, Camera, X, LogOut, Upload } from "lucide-react"
import Image from "next/image"
import { User } from "lucide-react"

interface ChatHistory {
  id: string
  title: string
  messages: any[]
  timestamp: Date
}

interface FarmUser {
  id: string
  name: string
  email: string
  farmSize: string
  location: string
  primaryCrops: string
}

const quickActions = [
  {
    icon: Leaf,
    label: "Crop Advice",
    prompt: "I need advice about growing crops. What should I consider for the current season?",
  },
  {
    icon: Bug,
    label: "Pest Control",
    prompt: "I'm having pest problems with my crops. Can you help me identify and manage them naturally?",
  },
  { icon: Droplets, label: "Irrigation", prompt: "How can I improve my water management and irrigation practices?" },
  {
    icon: Sun,
    label: "Weather Tips",
    prompt: "How should I adjust my farming practices based on current weather conditions?",
  },
  {
    icon: Camera,
    label: "Image Analysis",
    prompt: "I'd like to upload a photo of my crops for analysis. Can you help identify any issues?",
  },
]

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
]

export default function eAgriChat() {
  const [user, setUser] = useState<FarmUser | null>(null)
  const [language, setLanguage] = useState("en")
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [showUserMenu, setShowUserMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } = useChat({
    body: { language },
    onFinish: (message) => {
      // Save conversation to history
      if (messages.length > 0) {
        const chatId = currentChatId || Date.now().toString()
        const title = messages[0]?.content?.slice(0, 50) + "..." || "New Conversation"

        setChatHistory((prev) => {
          const existingIndex = prev.findIndex((chat) => chat.id === chatId)
          const updatedChat = {
            id: chatId,
            title,
            messages: [...messages, message],
            timestamp: new Date(),
          }

          if (existingIndex >= 0) {
            const updated = [...prev]
            updated[existingIndex] = updatedChat
            return updated
          } else {
            return [updatedChat, ...prev]
          }
        })

        if (!currentChatId) {
          setCurrentChatId(chatId)
        }
      }
    },
  })

  // Check authentication
  useEffect(() => {
    const userData = localStorage.getItem("eagri-user")
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push("/auth/login")
    }
  }, [router])

  // Load chat history from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`eagri-chat-history-${user.id}`)
      if (saved) {
        setChatHistory(JSON.parse(saved))
      }
    }
  }, [user])

  // Save chat history to localStorage
  useEffect(() => {
    if (user && chatHistory.length > 0) {
      localStorage.setItem(`eagri-chat-history-${user.id}`, JSON.stringify(chatHistory))
    }
  }, [chatHistory, user])

  const handleLogout = () => {
    localStorage.removeItem("eagri-user")
    setUser(null)
    router.push("/auth/login")
  }

  const startNewChat = () => {
    setMessages([])
    setCurrentChatId(null)
    setShowHistory(false)
    setUploadedImages([])
  }

  const loadChat = (chat: ChatHistory) => {
    setMessages(chat.messages)
    setCurrentChatId(chat.id)
    setShowHistory(false)
  }

  const handleQuickAction = (prompt: string) => {
    if (prompt.includes("upload a photo")) {
      fileInputRef.current?.click()
      return
    }

    const syntheticEvent = {
      preventDefault: () => {},
      target: { prompt: { value: prompt } },
    } as any

    handleInputChange({ target: { value: prompt } } as any)
    setTimeout(() => {
      handleSubmit(syntheticEvent)
    }, 100)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      setUploadedImages((prev) => [...prev, base64])

      // Send image with message
      await append({
        role: "user",
        content: [
          {
            type: "text",
            text: "Please analyze this image of my crops and provide farming advice:",
          },
          {
            type: "image",
            image: base64,
          },
        ],
      })
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const getGreeting = () => {
    const greetings = {
      en: `Hello ${user?.name}! I'm e-Agri, your AI farming assistant. How can I help you with your ${user?.primaryCrops} crops today?`,
      es: `¡Hola ${user?.name}! Soy e-Agri, tu asistente de IA agrícola. ¿Cómo puedo ayudarte con tus cultivos de ${user?.primaryCrops} hoy?`,
      fr: `Bonjour ${user?.name}! Je suis e-Agri, votre assistant IA agricole. Comment puis-je vous aider avec vos cultures de ${user?.primaryCrops} aujourd'hui?`,
    }
    return greetings[language as keyof typeof greetings] || greetings.en
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Image src="/eagri-logo.png" alt="e-Agri Logo" width={40} height={40} className="rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-teal-800">e-Agri</h1>
                <p className="text-sm text-teal-600">AI Farming Assistant</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-32">
                  <Globe className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="mr-2">{lang.flag}</span>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center space-x-2"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={startNewChat}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                New Chat
              </Button>

              {/* User Menu */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.name}</span>
                </Button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.location}</p>
                      <p className="text-xs text-gray-500">{user.farmSize} farm</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat History Sidebar */}
          {showHistory && (
            <Card className="lg:col-span-1">
              <CardHeader>
                <h3 className="font-semibold text-green-800">Chat History</h3>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {chatHistory.length === 0 ? (
                    <p className="text-gray-500 text-sm">No conversations yet</p>
                  ) : (
                    <div className="space-y-2">
                      {chatHistory.map((chat) => (
                        <Button
                          key={chat.id}
                          variant="ghost"
                          className="w-full justify-start text-left h-auto p-3"
                          onClick={() => loadChat(chat)}
                        >
                          <div className="truncate">
                            <p className="font-medium text-sm truncate">{chat.title}</p>
                            <p className="text-xs text-gray-500">{new Date(chat.timestamp).toLocaleDateString()}</p>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Main Chat Area */}
          <Card className={`${showHistory ? "lg:col-span-3" : "lg:col-span-4"}`}>
            <CardContent className="p-0">
              {/* Chat Messages */}
              <ScrollArea className="h-[60vh] p-6">
                {messages.length === 0 ? (
                  <div className="text-center space-y-6">
                    <div className="space-y-2">
                      <Image
                        src="/eagri-logo.png"
                        alt="e-Agri"
                        width={80}
                        height={80}
                        className="mx-auto rounded-xl"
                      />
                      <h2 className="text-2xl font-bold text-teal-800">Welcome back, {user.name}!</h2>
                      <p className="text-gray-600 max-w-md mx-auto">{getGreeting()}</p>
                      <Alert className="max-w-md mx-auto">
                        <Camera className="h-4 w-4" />
                        <AlertDescription>
                          You can now upload photos of your crops for AI analysis and personalized advice!
                        </AlertDescription>
                      </Alert>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-green-50 hover:border-green-300 bg-transparent"
                          onClick={() => handleQuickAction(action.prompt)}
                        >
                          <action.icon className="w-6 h-6 text-green-600" />
                          <span className="text-sm font-medium">{action.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            message.role === "user"
                              ? "bg-green-600 text-white"
                              : "bg-white border border-gray-200 text-gray-800"
                          }`}
                        >
                          {Array.isArray(message.content) ? (
                            <div className="space-y-2">
                              {message.content.map((part: any, index: number) => (
                                <div key={index}>
                                  {part.type === "text" && <div className="whitespace-pre-wrap">{part.text}</div>}
                                  {part.type === "image" && (
                                    <img
                                      src={part.image || "/placeholder.svg"}
                                      alt="Uploaded crop"
                                      className="max-w-full h-auto rounded"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap">{message.content}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="animate-pulse flex space-x-1">
                              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500">e-Agri is analyzing...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <Separator />

              {/* Image Preview */}
              {uploadedImages.length > 0 && (
                <div className="p-4 border-b">
                  <div className="flex flex-wrap gap-2">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Upload ${index + 1}`}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Form */}
              <div className="p-6">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder={
                      language === "es"
                        ? "Escribe tu pregunta sobre agricultura o sube una foto..."
                        : language === "fr"
                          ? "Tapez votre question sur l'agriculture ou téléchargez une photo..."
                          : "Type your farming question or upload a photo..."
                    }
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || (!input || input.trim() === "") && uploadedImages.length === 0}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {language === "es"
                    ? "e-Agri puede cometer errores. Verifica información importante."
                    : language === "fr"
                      ? "e-Agri peut faire des erreurs. Vérifiez les informations importantes."
                      : "e-Agri can make mistakes. Check important info."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
