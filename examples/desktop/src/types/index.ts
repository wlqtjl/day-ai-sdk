export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

// Chat types
export interface ToolCall {
  id: string
  name: string
  parameters: Record<string, unknown>
}

export interface ToolResult {
  toolCallId: string
  toolName: string
  success: boolean
  result?: unknown
  error?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  thinking?: string
  toolCall?: ToolCall
  toolResult?: ToolResult
  isStreaming?: boolean
  isThinking?: boolean
}

export interface AgentResponse {
  thinking?: string
  content: string
  toolCall?: ToolCall
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens'
}

export interface StreamChunk {
  type: 'text' | 'thinking'
  content: string
}

// MCP types
export interface MCPOAuthTokens {
  clientId: string
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

export interface MCPServerConfig {
  id: string
  name: string
  baseUrl: string
  mcpEndpoint: string
  authEndpoint: string
  tokenEndpoint: string
  registrationEndpoint: string
  scopes: string[]
  connected: boolean
  oauth?: MCPOAuthTokens
}

export interface MCPTool {
  serverId: string
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

// App config type
export interface AppConfig {
  anthropicApiKey?: string
  doubaoApiKey?: string
  qianwenApiKey?: string
  llmType?: 'claude' | 'doubao' | 'qianwen'
  mcpServers?: MCPServerConfig[]
}

// DayAI API interface
export interface DayAIChatAPI {
  sendMessage: (noteId: string, message: string) => Promise<AgentResponse>
  executeToolAndContinue: (noteId: string, toolCall: ToolCall) => Promise<{ toolResult: ToolResult; response: AgentResponse }>
  getHistory: (noteId: string) => Promise<ChatMessage[]>
  saveMessage: (noteId: string, message: ChatMessage) => Promise<void>
  clearHistory: (noteId: string) => Promise<void>
  abort: () => Promise<void>
  onStreamChunk: (callback: (chunk: StreamChunk) => void) => () => void
  onStreamEnd: (callback: () => void) => () => void
  onStreamError: (callback: (error: string) => void) => () => void
  onNoteUpdated: (callback: (noteId: string) => void) => () => void
  onNotesChanged: (callback: () => void) => () => void
}

export interface DayAIMCPAPI {
  getServers: () => Promise<MCPServerConfig[]>
  connect: (serverId: string) => Promise<MCPTool[]>
  disconnect: (serverId: string) => Promise<void>
  listTools: () => Promise<MCPTool[]>
  callTool: (serverId: string, toolName: string, args: Record<string, unknown>) => Promise<unknown>
}

export interface DayAIApi {
  // Notes API
  getNotes: () => Promise<Note[]>
  getNote: (id: string) => Promise<Note | null>
  createNote: () => Promise<Note>
  updateNote: (id: string, updates: Partial<Note>) => Promise<Note | null>
  deleteNote: (id: string) => Promise<boolean>

  // Platform API
  getPlatform: () => Promise<'darwin' | 'win32' | 'linux'>
  getIsFullscreen: () => Promise<boolean>
  onFullscreenChange: (callback: (isFullscreen: boolean) => void) => () => void

  // Config API
  getConfig: () => Promise<AppConfig>
  setConfig: (config: Partial<AppConfig>) => Promise<AppConfig>

  // Chat API
  chat: DayAIChatAPI

  // MCP API
  mcp: DayAIMCPAPI
}

// Type declaration for renderer process
declare global {
  interface Window {
    dayai: DayAIApi
  }
}
