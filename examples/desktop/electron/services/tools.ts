import type Anthropic from '@anthropic-ai/sdk'

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'update_note',
    description:
      'Replace the entire content of the current note with new content. Use this when the user asks to edit, rewrite, or modify the note.',
    input_schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The new content for the note (plain text or simple HTML)',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'search_notes',
    description: 'Search through all notes by title or content. Returns matching notes with snippets.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to match against note titles and content',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_note',
    description: 'Create a new note with the specified title and content.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title for the new note',
        },
        content: {
          type: 'string',
          description: 'The content for the new note (optional)',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'read_note',
    description:
      'Read the full content of another note by its ID or title. Use this when the user references another note.',
    input_schema: {
      type: 'object',
      properties: {
        noteId: {
          type: 'string',
          description: 'The ID of the note to read (optional if title provided)',
        },
        title: {
          type: 'string',
          description: 'The title of the note to read (optional if noteId provided)',
        },
      },
    },
  },
  {
    name: 'collect_wechat_messages',
    description: 'Collect WeChat chat messages from local storage. Returns recent chat history.',
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'Maximum number of messages to return per chat (default: 50)',
          default: 50,
        },
        include_groups: {
          type: 'boolean',
          description: 'Whether to include group chats (default: true)',
          default: true,
        },
        platform: {
          type: 'string',
          description: 'Target platform (auto, darwin, win32, android, ios) (default: auto)',
          default: 'auto',
          enum: ['auto', 'darwin', 'win32', 'android', 'ios'],
        },
        real_time: {
          type: 'boolean',
          description: 'Whether to enable real-time collection (default: false)',
          default: false,
        },
        method: {
          type: 'string',
          description: 'Collection method (auto, file_watcher, backup_hook, third_party) (default: auto)',
          default: 'auto',
          enum: ['auto', 'file_watcher', 'backup_hook', 'third_party'],
        },
      },
    },
  },
]
