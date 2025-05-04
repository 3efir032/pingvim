import { Menu, Settings, Search, User, Minimize2, Maximize2, X } from "lucide-react"

export default function Toolbar() {
  return (
    <div className="flex items-center justify-between bg-[#3c3f41] border-b border-gray-700 text-sm">
      <div className="flex items-center">
        <button className="p-2 hover:bg-gray-600">
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center px-3 py-2 hover:bg-gray-600">
          <span className="font-medium">PingVim</span>
        </div>

        <div className="flex items-center px-3 py-2 hover:bg-gray-600">
          <span>File</span>
        </div>

        <div className="flex items-center px-3 py-2 hover:bg-gray-600">
          <span>Edit</span>
        </div>

        <div className="flex items-center px-3 py-2 hover:bg-gray-600">
          <span>View</span>
        </div>

        <div className="flex items-center px-3 py-2 hover:bg-gray-600">
          <span>Tools</span>
        </div>
      </div>

      <div className="flex items-center">
        <button className="p-2 hover:bg-gray-600">
          <Search className="h-4 w-4" />
        </button>

        <button className="p-2 hover:bg-gray-600">
          <Settings className="h-4 w-4" />
        </button>

        <button className="p-2 hover:bg-gray-600">
          <User className="h-4 w-4" />
        </button>

        <button className="p-2 hover:bg-gray-600">
          <Minimize2 className="h-4 w-4" />
        </button>

        <button className="p-2 hover:bg-gray-600">
          <Maximize2 className="h-4 w-4" />
        </button>

        <button className="p-2 hover:bg-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
