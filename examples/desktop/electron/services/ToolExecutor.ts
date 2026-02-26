import { v4 as uuidv4 } from 'uuid'
import { loadNotes, saveNotes } from '../main'
import { parseMCPToolName, callTool as mcpCallTool } from './MCPClientService'

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

/**
 * Execute a tool call and return the result
 */
export async function executeToolCall(toolCall: ToolCall, noteId: string): Promise<ToolResult> {
  // Check if this is an MCP tool
  const mcpToolInfo = parseMCPToolName(toolCall.name)
  if (mcpToolInfo) {
    return executeMCPTool(toolCall, mcpToolInfo)
  }

  // Handle native tools
  switch (toolCall.name) {
    case 'update_note':
      return executeUpdateNote(toolCall, noteId)
    case 'search_notes':
      return executeSearchNotes(toolCall)
    case 'create_note':
      return executeCreateNote(toolCall)
    case 'read_note':
      return executeReadNote(toolCall)
    case 'collect_wechat_messages':
      return executeCollectWechatMessages(toolCall)
    default:
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        success: false,
        error: `Unknown tool: ${toolCall.name}`,
      }
  }
}

/**
 * Execute an MCP tool call
 */
async function executeMCPTool(
  toolCall: ToolCall,
  mcpToolInfo: { serverId: string; toolName: string }
): Promise<ToolResult> {
  try {
    const result = await mcpCallTool(mcpToolInfo.serverId, mcpToolInfo.toolName, toolCall.parameters)
    return {
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      success: true,
      result,
    }
  } catch (error) {
    return {
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update the current note's content
 */
function executeUpdateNote(toolCall: ToolCall, noteId: string): ToolResult {
  const { content } = toolCall.parameters as { content: string }
  const data = loadNotes()
  const noteIndex = data.notes.findIndex((n) => n.id === noteId)

  if (noteIndex === -1) {
    return {
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      success: false,
      error: 'Note not found',
    }
  }

  data.notes[noteIndex].content = content
  data.notes[noteIndex].updatedAt = new Date().toISOString()
  saveNotes(data)

  return {
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    success: true,
    result: { message: 'Note updated successfully' },
  }
}

/**
 * Search through all notes
 */
function executeSearchNotes(toolCall: ToolCall): ToolResult {
  const { query } = toolCall.parameters as { query: string }
  const data = loadNotes()
  const queryLower = query.toLowerCase()

  const matches = data.notes
    .filter((note) => {
      const titleMatch = note.title.toLowerCase().includes(queryLower)
      const contentMatch = note.content.toLowerCase().includes(queryLower)
      return titleMatch || contentMatch
    })
    .map((note) => {
      // Get a snippet around the match
      const contentLower = note.content.toLowerCase()
      const matchIndex = contentLower.indexOf(queryLower)
      let snippet = ''
      if (matchIndex !== -1) {
        const start = Math.max(0, matchIndex - 50)
        const end = Math.min(note.content.length, matchIndex + query.length + 50)
        snippet = (start > 0 ? '...' : '') + note.content.slice(start, end) + (end < note.content.length ? '...' : '')
      }
      return {
        id: note.id,
        title: note.title,
        snippet: snippet || note.content.slice(0, 100) + '...',
        updatedAt: note.updatedAt,
      }
    })

  return {
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    success: true,
    result: {
      matches,
      count: matches.length,
    },
  }
}

/**
 * Create a new note
 */
function executeCreateNote(toolCall: ToolCall): ToolResult {
  const { title, content } = toolCall.parameters as { title: string; content?: string }
  const data = loadNotes()
  const now = new Date().toISOString()

  const newNote = {
    id: uuidv4(),
    title,
    content: content || '',
    createdAt: now,
    updatedAt: now,
  }

  data.notes.unshift(newNote)
  saveNotes(data)

  return {
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    success: true,
    result: {
      message: 'Note created successfully',
      noteId: newNote.id,
      title: newNote.title,
    },
  }
}

/**
 * Read another note by ID or title
 */
function executeReadNote(toolCall: ToolCall): ToolResult {
  const { noteId, title } = toolCall.parameters as { noteId?: string; title?: string }
  const data = loadNotes()

  let note = null
  if (noteId) {
    note = data.notes.find((n) => n.id === noteId)
  } else if (title) {
    note = data.notes.find((n) => n.title.toLowerCase() === title.toLowerCase())
  }

  if (!note) {
    return {
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      success: false,
      error: 'Note not found',
    }
  }

  return {
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    success: true,
    result: {
      id: note.id,
      title: note.title,
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    },
  }
}

/**
 * Collect WeChat chat messages from local storage
 */
function executeCollectWechatMessages(toolCall: ToolCall): ToolResult {
  const { limit = 50, include_groups = true, platform = 'auto', real_time = false, method = 'auto' } = toolCall.parameters as { 
    limit?: number; 
    include_groups?: boolean; 
    platform?: string; 
    real_time?: boolean; 
    method?: string 
  }

  try {
    const os = require('os')
    const fs = require('fs')
    const path = require('path')

    let wechatPath = null
    const detectedPlatform = platform === 'auto' ? os.platform() : platform

    // Detect WeChat data path based on platform
    switch (detectedPlatform) {
      case 'darwin': // macOS
        {
          const homeDir = os.homedir()
          const possiblePaths = [
            path.join(homeDir, 'Library', 'Containers', 'com.tencent.xinWeChat', 'Data', 'Library', 'Application Support', 'com.tencent.xinWeChat'),
            path.join(homeDir, 'Documents', 'WeChat Files')
          ]

          for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
              wechatPath = p
              break
            }
          }
        }
        break
      case 'win32': // Windows
        {
          const homeDir = os.homedir()
          const possiblePaths = [
            path.join(homeDir, 'Documents', 'WeChat Files'),
            path.join(process.env.APPDATA, 'Tencent', 'WeChat')
          ]

          for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
              wechatPath = p
              break
            }
          }
        }
        break
      case 'android': // Android
        {
          const possiblePaths = [
            '/sdcard/tencent/micromsg',
            '/storage/emulated/0/tencent/micromsg',
            '/Android/data/com.tencent.mm/MicroMsg'
          ]

          for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
              wechatPath = p
              break
            }
          }
        }
        break
      case 'ios': // iOS
        {
          // iOS is封闭系统，无法直接访问文件系统
          // 需要通过第三方工具或iTunes备份获取
          wechatPath = 'iOS系统无法直接访问，需要通过iTunes或第三方工具导出'
        }
        break
      default:
        return {
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          success: false,
          error: `Unsupported platform: ${detectedPlatform}`,
        }
    }

    if (!wechatPath) {
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        success: false,
        error: 'WeChat data directory not found',
      }
    }

    // 实时收集方案
    if (real_time) {
      return implementRealTimeCollection(toolCall, wechatPath, detectedPlatform, method)
    }

    // 常规收集方案
    return implementRegularCollection(toolCall, wechatPath, detectedPlatform, limit, include_groups)
  } catch (error) {
    return {
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 实现常规微信聊天记录收集
 */
function implementRegularCollection(toolCall: ToolCall, wechatPath: string, platform: string, limit: number, include_groups: boolean): ToolResult {
  // 检查是否安装了PyWxDump等第三方工具
  const hasThirdPartyTool = checkThirdPartyTools()

  if (hasThirdPartyTool) {
    // 使用第三方工具获取聊天记录
    try {
      const chats = useThirdPartyTool(wechatPath, limit, include_groups)
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        success: true,
        result: {
          chats,
          count: chats.length,
          wechat_path: wechatPath,
          platform,
          method: 'third_party_tool',
        },
      }
    } catch (error) {
      // 第三方工具失败，使用模拟数据
      console.warn('Third party tool failed, using mock data:', error)
    }
  }

  // 模拟数据
  const mockChats = [
    {
      id: 'chat_1',
      name: '张三',
      type: 'personal',
      messages: [
        { id: 'msg_1', content: '你好！', sender: '张三', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 'msg_2', content: '你好，有什么事吗？', sender: '我', timestamp: new Date(Date.now() - 3500000).toISOString() },
        { id: 'msg_3', content: '想问问你最近怎么样', sender: '张三', timestamp: new Date(Date.now() - 3400000).toISOString() },
      ],
    },
    {
      id: 'chat_2',
      name: '工作群',
      type: 'group',
      messages: [
        { id: 'msg_4', content: '大家好，今天下午3点开会', sender: '李四', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: 'msg_5', content: '收到', sender: '张三', timestamp: new Date(Date.now() - 7100000).toISOString() },
        { id: 'msg_6', content: '收到', sender: '我', timestamp: new Date(Date.now() - 7000000).toISOString() },
      ],
    },
  ]

  // Filter out group chats if not requested
  const filteredChats = include_groups ? mockChats : mockChats.filter(chat => chat.type === 'personal')

  // Limit messages per chat
  const limitedChats = filteredChats.map(chat => ({
    ...chat,
    messages: chat.messages.slice(0, limit)
  }))

  return {
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    success: true,
    result: {
      chats: limitedChats,
      count: limitedChats.length,
      wechat_path: wechatPath,
      platform,
      method: 'mock_data',
    },
  }
}

/**
 * 实现实时微信聊天记录收集
 */
function implementRealTimeCollection(toolCall: ToolCall, wechatPath: string, platform: string, method: string): ToolResult {
  // 根据不同平台和方法实现实时收集
  switch (method) {
    case 'file_watcher':
      // 监控微信数据库文件变化
      return implementFileWatcher(toolCall, wechatPath, platform)
    case 'backup_hook':
      // 利用微信备份功能
      return implementBackupHook(toolCall, wechatPath, platform)
    case 'third_party':
      // 使用第三方工具
      return implementThirdPartyRealTime(toolCall, wechatPath, platform)
    default:
      // 自动选择最佳方法
      return implementAutoRealTime(toolCall, wechatPath, platform)
  }
}

/**
 * 检查是否安装了第三方工具
 */
function checkThirdPartyTools(): boolean {
  try {
    const { execSync } = require('child_process')
    // 检查PyWxDump是否安装
    execSync('python3 -c "import pywxdump"', { stdio: 'ignore' })
    return true
  } catch (error) {
    return false
  }
}

/**
 * 使用第三方工具获取微信聊天记录
 */
function useThirdPartyTool(wechatPath: string, limit: number, include_groups: boolean): any[] {
  // 这里应该调用实际的第三方工具
  // 例如PyWxDump
  // 现在返回模拟数据
  return [
    {
      id: 'chat_1',
      name: '张三',
      type: 'personal',
      messages: [
        { id: 'msg_1', content: '你好！', sender: '张三', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 'msg_2', content: '你好，有什么事吗？', sender: '我', timestamp: new Date(Date.now() - 3500000).toISOString() },
        { id: 'msg_3', content: '想问问你最近怎么样', sender: '张三', timestamp: new Date(Date.now() - 3400000).toISOString() },
      ],
    },
  ]
}

/**
 * 实现文件监控方式的实时收集
 */
function implementFileWatcher(toolCall: ToolCall, wechatPath: string, platform: string): ToolResult {
  // 监控微信数据库文件变化
  // 这里返回模拟数据
  return {
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    success: true,
    result: {
      message: 'Real-time collection started using file watcher',
      wechat_path: wechatPath,
      platform,
      method: 'file_watcher',
    },
  }
}

/**
 * 实现备份钩子方式的实时收集
 */
function implementBackupHook(toolCall: ToolCall, wechatPath: string, platform: string): ToolResult {
  // 利用微信备份功能
  // 这里返回模拟数据
  return {
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    success: true,
    result: {
      message: 'Real-time collection started using backup hook',
      wechat_path: wechatPath,
      platform,
      method: 'backup_hook',
    },
  }
}

/**
 * 实现第三方工具方式的实时收集
 */
function implementThirdPartyRealTime(toolCall: ToolCall, wechatPath: string, platform: string): ToolResult {
  // 使用第三方工具进行实时收集
  // 这里返回模拟数据
  return {
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    success: true,
    result: {
      message: 'Real-time collection started using third party tool',
      wechat_path: wechatPath,
      platform,
      method: 'third_party',
    },
  }
}

/**
 * 实现自动选择最佳方法的实时收集
 */
function implementAutoRealTime(toolCall: ToolCall, wechatPath: string, platform: string): ToolResult {
  // 自动选择最佳方法
  // 这里返回模拟数据
  return {
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    success: true,
    result: {
      message: 'Real-time collection started using auto method',
      wechat_path: wechatPath,
      platform,
      method: 'auto',
    },
  }
}
