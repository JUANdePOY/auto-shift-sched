import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { Button } from '../../shared/components/ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger } from '../../shared/components/ui/tooltip';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  ChevronRight,
  Zap,
  Clock,
  User
} from 'lucide-react';
import { useAuth } from '../../auth/contexts/AuthContext';


type AdminView = 'dashboard' | 'schedule' | 'employees' | 'availability' | 'settings';
type CrewView = 'dashboard' | 'availability' | 'profile';
type View = AdminView | CrewView;

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  suggestionsCount?: number;
}

interface NavItem {
  id: View;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();

  const getNavItems = (): NavItem[] => {
    if (user?.role === 'admin') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'schedule',
          label: 'Schedule',
          icon: Calendar,
        },
        {
          id: 'employees',
          label: 'Employees',
          icon: Users,
        },
        {
          id: 'availability',
          label: 'Availability',
          icon: Clock,
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
        },
      ];
    } else if (user?.role === 'crew') {
      return [
        {
          id: 'dashboard',
          label: 'My Dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'availability',
          label: 'Submit Availability',
          icon: Clock,
        },
        {
          id: 'profile',
          label: 'My Profile',
          icon: User,
        },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  return (
    <TooltipProvider delayDuration={0}>
      <div 
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-50 transition-all duration-300 ease-in-out",
          isExpanded ? "w-64" : "w-18"
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Header */}
        <div className="p-3.5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className={cn(
              "transition-all duration-300 ease-in-out overflow-hidden",
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}>
              <h2 className="text-sidebar-foreground whitespace-nowrap">ShiftAI</h2>
              <p className="text-xs text-sidebar-foreground/60 whitespace-nowrap">Smart Scheduling</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-12 px-3 transition-all duration-200",
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        !isExpanded && "flex justify-center "
                      )}
                      onClick={() => onViewChange(item.id)}
                    >
                      <div className="relative flex items-center">
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {item.badge !== undefined && item.badge > 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs">
                            {item.badge > 99 ? '99+' : item.badge}
                          </div>
                        )}
                      </div>
                      
                      <span className={cn(
                        "ml-3 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                        isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                      )}>
                        {item.label}
                      </span>

                      {isActive && isExpanded && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  
                  
                </Tooltip>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-sidebar-border">
          <div className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            isExpanded ? "opacity-100" : "opacity-0"
          )}>
            <div className="p-3 bg-sidebar-accent/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-sidebar-foreground">System Online</span>
              </div>
              <p className="text-xs text-sidebar-foreground/60">
                AI scheduling engine active
              </p>
            </div>
          </div>
          
          {!isExpanded && (
            <div className="flex justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}