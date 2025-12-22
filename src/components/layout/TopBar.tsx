import { useAuth } from '@/contexts/AuthContext';
import { Bell, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { roleLabels } from '@/types/auth';

export function TopBar() {
  const { user } = useAuth();

  if (!user) return null;

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    // Fixed height h-16 + z-index + solid bg-card ensures it sits flush at the top
    <header className="sticky top-0 z-40 h-16 shrink-0 border-b border-border bg-card backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left: Search */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students, classes, reports..."
              className="pl-10 bg-muted/50 border-0"
            />
          </div>
        </div>

        {/* Center: Date */}
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{currentDate}</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:flex bg-muted/50">
            {roleLabels[user.role]}
          </Badge>
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>
        </div>
      </div>
    </header>
  );
}