import { useState, useEffect } from 'react'
import { IconLayoutSidebar, IconSparkles, IconPlus, IconSettings, IconUsers, IconFileText } from '@tabler/icons-react'

interface TopBarProps {
  leftSidebarVisible: boolean
  rightSidebarVisible: boolean
  onToggleLeftSidebar: () => void
  onToggleRightSidebar: () => void
  onNewNote: () => void
  onOpenSettings: () => void
  mode: 'notes' | 'customer-profile'
  onModeChange: (mode: 'notes' | 'customer-profile') => void
}

export default function TopBar({
  leftSidebarVisible,
  rightSidebarVisible,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onNewNote,
  onOpenSettings,
  mode,
  onModeChange,
}: TopBarProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    window.dayai.getIsFullscreen().then(setIsFullscreen)
    const unsubscribe = window.dayai.onFullscreenChange(setIsFullscreen)
    return unsubscribe
  }, [])

  return (
    <div className="h-[52px] flex-shrink-0 glass-panel border-b border-white/[0.06] drag-region flex items-center justify-between px-3">
      {/* Left side - traffic lights area + mode switch + sidebar toggle + new note */}
      <div className="flex items-center gap-1 no-drag">
        {/* Spacer for traffic lights (macOS) - hide in fullscreen */}
        {!isFullscreen && <div className="w-[70px]" />}

        {/* Mode switch */}
        <div className="flex items-center bg-white/5 rounded-lg p-0.5">
          <button
            onClick={() => onModeChange('notes')}
            className={`p-1.5 rounded-md transition-all duration-200 ${
              mode === 'notes'
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white'
            }`}
            title="Notes mode"
          >
            <IconFileText size={18} stroke={1.5} />
          </button>
          <button
            onClick={() => onModeChange('customer-profile')}
            className={`p-1.5 rounded-md transition-all duration-200 ${
              mode === 'customer-profile'
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white'
            }`}
            title="Customer profile mode"
          >
            <IconUsers size={18} stroke={1.5} />
          </button>
        </div>

        <button
          onClick={onToggleLeftSidebar}
          className={`p-2 rounded-lg transition-all duration-200 ${
            leftSidebarVisible
              ? 'text-white hover:bg-white/10'
              : 'text-white/50 hover:bg-white/10 hover:text-white/80'
          }`}
          title={leftSidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
        >
          <IconLayoutSidebar size={20} stroke={1.5} />
        </button>

        {mode === 'notes' && (
          <button
            onClick={onNewNote}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
            title="New note"
          >
            <IconPlus size={20} stroke={1.5} />
          </button>
        )}
      </div>

      {/* Center spacer for drag region */}
      <div className="flex-1" />

      {/* Right side - settings + chat sidebar toggle */}
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
          title="Settings"
        >
          <IconSettings size={20} stroke={1.5} />
        </button>

        <button
          onClick={onToggleRightSidebar}
          className={`p-2 rounded-lg transition-all duration-200 ${
            rightSidebarVisible
              ? 'text-white hover:bg-white/10'
              : 'text-white/50 hover:bg-white/10 hover:text-white/80'
          }`}
          title={rightSidebarVisible ? 'Hide chat' : 'Show chat'}
        >
          <IconSparkles size={20} stroke={1.5} />
        </button>
      </div>
    </div>
  )
}
