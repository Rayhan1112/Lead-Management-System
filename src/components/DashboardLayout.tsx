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
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { NotificationDropdown } from '@/components/dashboard/NotificationDropdown';
import { MobileNavBar } from '@/components/mobile/MobileNavBar';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // User details
  const userName = user?.firstName || 'User ';
  const userEmail = user?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();
  const userRole = user?.role === 'admin' ? 'Admin' : 'agent';

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Menu items configuration
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Leads', path: '/leads' },
    ...(user?.role === 'admin' ? [
      { icon: Users, label: 'Agents', path: '/agents' },
      { icon: BarChartBig, label: 'Assign Leads', path: '/assignLeads' }
    ] : []),
    { icon: FileText, label: 'Tasks', path: '/tasks' },
    { icon: Calendar, label: 'Meetings', path: '/meetings' },
    { icon: BarChartBig, label: 'Deals', path: '/deals' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:block hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                P
              </div>
              <h2 className="text-lg font-semibold dark:text-white">PTS - CRM</h2>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
          
          <Separator className="dark:bg-gray-700" />
          
          {/* Navigation Menu */}
          <div className="flex-1 py-4 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
          
          <Separator className="dark:bg-gray-700" />
          
          {/* User Profile Section */}
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.photoURL} alt={userName} />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate dark:text-white">{userName}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{userRole}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                  <div className="group relative">
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px] inline-block">
                      {userEmail.split('@')[0]}@...
                    </span>
                    <div className="absolute hidden group-hover:block bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-[200px]">
                      <p className="text-xs text-gray-700 dark:text-gray-300">{userEmail}</p>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label="Log out"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </Button>
            <h1 className="ml-4 text-lg font-semibold lg:text-xl dark:text-white">
              {userName}'s Workspace
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
            
            <NotificationDropdown />
            
            {/* User Profile Dropdown */}
            <div className="relative group">
              <Button
                variant="ghost"
                className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL} alt={userName} />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm font-medium dark:text-white">
                  {userEmail} ({user.role.toLocaleUpperCase()})
                </span>
              </Button>
              
              <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 hidden group-hover:block border border-gray-200 dark:border-gray-700">
                <div className="py-1">
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium dark:text-white">{userName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</p>
                  </div>
                  <Separator className="dark:bg-gray-700" />
                  <button
                    onClick={() => navigate('/profile')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Your Profile
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Account Settings
                  </button>
                  <Separator className="dark:bg-gray-700" />
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Now scrollable */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 md:pb-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation */}
        {isMobile && <MobileNavBar />}
      </div>
    </div>
  );
};

export default DashboardLayout;