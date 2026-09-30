import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  UtensilsCrossed,
  Clock,
  UserCheck,
  Bell,
  Keyboard,
  RotateCcw,
  PlusCircle,
  Building2,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign
} from 'lucide-react';

interface HeaderProps {
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenShortcuts }) => {
  const {
    branch,
    currentEmployee,
    employees,
    switchEmployee,
    currentShift,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    setActiveTab,
    resetDemoData,
  } = usePOS();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadNotifications = notifications.filter(n => !n.read);

  const formattedDate = currentTime.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'branch_manager':
      case 'super_admin':
      case 'owner':
        return 'bg-purple-900/60 text-purple-300 border-purple-700/50';
      case 'cashier':
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50';
      case 'waiter':
        return 'bg-blue-900/60 text-blue-300 border-blue-700/50';
      case 'kitchen_staff':
        return 'bg-amber-900/60 text-amber-300 border-amber-700/50';
      case 'delivery_rider':
        return 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between select-none z-30 sticky top-0 shadow-md">
      {/* Brand & Branch */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('pos')}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
            <UtensilsCrossed className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-wider uppercase bg-gradient-to-r from-amber-400 via-amber-200 to-white bg-clip-text text-transparent">
                Fork n Knives
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                POS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-amber-400/80 inline" />
              <span>{branch.name}</span>
            </p>
          </div>
        </div>

        {/* Shift Indicator */}
        <div
          onClick={() => setActiveTab('shifts')}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition text-xs"
          title="Click to view shift details"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Shift</span>
            <span className="font-semibold text-slate-200">
              {currentShift ? currentShift.shiftNumber : 'No Active Shift'}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Live Date & Time */}
      <div className="hidden lg:flex items-center gap-3 bg-slate-950/60 px-4 py-1.5 rounded-lg border border-slate-800 text-xs">
        <Clock className="w-4 h-4 text-amber-400" />
        <span className="text-slate-300 font-medium">{formattedDate}</span>
        <span className="text-slate-600">|</span>
        <span className="font-mono text-amber-400 font-bold tracking-wider">{formattedTime}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Quick New Order Button */}
        <button
          onClick={() => setActiveTab('pos')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">New Order</span>
        </button>

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          title="Keyboard Shortcuts (Shift + ?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadNotifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm text-slate-200">System Notifications</span>
                  {unreadNotifications.length > 0 && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                      {unreadNotifications.length} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-500 hover:text-slate-300 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    No active notifications
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationAsRead(notif.id);
                        if (notif.linkTab) setActiveTab(notif.linkTab);
                        setShowNotifications(false);
                      }}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                        notif.read
                          ? 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                          : 'bg-slate-800/90 border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="mt-0.5">
                        {notif.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : notif.severity === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-sky-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-200 truncate">{notif.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                          {notif.message}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-1 font-mono">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logged-in Employee & Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                {currentEmployee.name}
              </span>
              <span
                className={`text-[9px] px-1 rounded uppercase font-bold border inline-block tracking-wider ${getRoleBadgeColor(
                  currentEmployee.role
                )}`}
              >
                {currentEmployee.role.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Quick User Role Switcher Dropdown */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-[11px] text-slate-400">Current Staff Member</p>
                <p className="text-xs font-bold text-slate-200">{currentEmployee.name}</p>
                <p className="text-[10px] text-amber-400 font-mono">PIN: {currentEmployee.pin}</p>
              </div>

              <div className="py-1">
                <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500">
                  Switch Active Role (Demo)
                </p>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {employees.map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => {
                        switchEmployee(emp.id);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between transition ${
                        emp.id === currentEmployee.id
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          {emp.role.replace('_', ' ')}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">PIN: {emp.pin}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-2 px-1">
                <button
                  onClick={() => {
                    if (window.confirm('Reset all demo orders, tables and shift data to fresh seed state?')) {
                      resetDemoData();
                      setShowUserDropdown(false);
                    }
                  }}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-md transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo Database</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
