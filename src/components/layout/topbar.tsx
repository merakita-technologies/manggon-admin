import { Button } from '@/components/ui/button'
import { Bell, Search, User, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface TopbarProps {
  isSidebarCollapsed: boolean;
  onMenuClick: () => void;
}

export function Topbar({ isSidebarCollapsed, onMenuClick }: TopbarProps) {
  return (
    <header className={`
      sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6
      transition-all duration-300
    `}>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onMenuClick}
        className="md:hidden h-8 w-8 p-0"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex flex-1 items-center gap-4">
        <form className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pl-8 md:w-[300px] lg:w-[400px]"
            />
          </div>
        </form>
        <Button variant="outline" size="icon" className="ml-auto">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}