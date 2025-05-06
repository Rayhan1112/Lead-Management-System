
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  BarChartBig,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Bell
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { NotificationDropdown } from '@/components/dashboard/NotificationDropdown';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Leads', path: '/leads' },
    { icon: Users, label: 'Agents', path: '/agents' },
    { icon: FileText, label: 'Tasks', path: '/tasks' },
    { icon: Calendar, label: 'Meetings', path: '/meetings' },
    { icon: BarChartBig, label: 'Deals', path: '/deals' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const agentMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Leads', path: '/leads' },
    { icon: FileText, label: 'Tasks', path: '/tasks' },
    { icon: Calendar, label: 'Meetings', path: '/meetings' },
    { icon: BarChartBig, label: 'Deals', path: '/deals' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const menuItems = isAdmin ? adminMenuItems : agentMenuItems;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-background border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-pulse rounded-full"></div>
              <h2 className="text-lg font-semibold">Pulse CRM</h2>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          <Separator />
          
          <div className="flex-1 py-4 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-pulse text-white shadow-md'
                        : 'text-foreground hover:bg-muted'
                    }`
                  }
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
          
          <Separator />
          
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Log out"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-background border-b border-border h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </Button>
            <h1 className="ml-4 text-lg font-semibold lg:text-xl">
              {isAdmin ? 'Admin' : 'Agent'} Dashboard
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <NotificationDropdown />
            
            <div className="relative group">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/settings')}
              >
                <User size={20} />
              </Button>
              <div className="absolute right-0 mt-1 w-32 rounded-md shadow-lg bg-popover border border-border hidden group-hover:block z-10">
                <div className="py-1 rounded-md">
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    Settings
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left block px-4 py-2 text-sm text-red-500 hover:bg-muted"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
