export default function StatusBar() {
  return (
    <div className="flex items-center justify-between bg-[#1B1C1F] px-2 py-1 text-xs text-gray-400">
      <div className="flex items-center space-x-4">
        <span>UTF-8</span>
        <span>LF</span>
        <span>PingVim</span>
      </div>

      <div className="flex items-center space-x-4">
        <span>Demo</span>
        <span>Version: v2.27</span>
      </div>
    </div>
  )
}
