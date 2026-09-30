import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Employee, EmployeeRole } from '../../types';
import {
  UserCog,
  Plus,
  Shield,
  Phone,
  KeyRound,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';

export const StaffManagement: React.FC = () => {
  const { branch, employees, currentEmployee, switchEmployee } = usePOS();

  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New staff form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<EmployeeRole>('waiter');
  const [pin, setPin] = useState('1234');

  const filteredEmployees = employees.filter(
    e => selectedRoleFilter === 'all' || e.role === selectedRoleFilter
  );

  const getRoleBadge = (r: EmployeeRole) => {
    switch (r) {
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

  const rolePermissionsSummary: Record<EmployeeRole, string[]> = {
    super_admin: ['Full Database Access', 'System Administration', 'All Financial Reports', 'Manage Staff & Permissions'],
    owner: ['Complete Operational Access', 'P&L Reports', 'Audits & Voids', 'Multi-Branch Controls'],
    branch_manager: ['Manager Overrides & PINs', 'Approve Discounts & Refunds', 'Cancel Paid Orders', 'Shift Closures', 'Inventory Purchases'],
    cashier: ['Create Any Order Type', 'Accept Payments & Settle', 'Standard Discounts (≤10%)', 'Print Receipts', 'Cash Float Transactions'],
    waiter: ['Dine-In Table Orders', 'Food Search & KOT Generation', 'Table Transfers', 'Add Food Items', 'No Financial Reports'],
    kitchen_staff: ['KDS Kitchen Display View', 'Change Food Prep Status', 'Reprint KOT', 'Station Routing', 'No Financial Access'],
    delivery_dispatcher: ['Assign Delivery Riders', 'Dispatch Deliveries', 'Customer CRM Lookup', 'Delivery Status Updates'],
    delivery_rider: ['Rider Mobile / Terminal View', 'Deliver Order & Collect Cash', 'End of Shift Settlement'],
    accountant: ['General Ledger & Reports', 'Expense Approvals', 'Supplier Payables', 'Shift Audit Logs'],
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-950 overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-amber-400" />
            <span>Staff Roster & Role-Based Permissions (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Granular employee credentials, POS PIN codes, and operational permission limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 border border-slate-700">
            Active Staff: <strong className="text-amber-400 font-mono">{employees.length}</strong>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Employees Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Staff Members (Click &quot;Switch To User&quot; to test role constraints)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map(emp => {
              const isCurrent = emp.id === currentEmployee.id;
              const permissions = rolePermissionsSummary[emp.role] || [];

              return (
                <div
                  key={emp.id}
                  className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition shadow-lg ${
                    isCurrent
                      ? 'bg-slate-900 border-amber-500 shadow-amber-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between pb-2 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 text-sm">{emp.name}</h4>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black uppercase">
                              Active User
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{emp.employeeId}</div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${getRoleBadge(
                          emp.role
                        )}`}
                      >
                        {emp.role.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="py-2.5 text-xs space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Mobile Phone:</span>
                        <span className="text-slate-200 font-mono">{emp.phone}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>POS Access PIN:</span>
                        <span className="text-amber-400 font-mono font-bold">
                          {emp.pin} {emp.role === 'branch_manager' ? '(Manager PIN)' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Joining Date:</span>
                        <span className="text-slate-300 font-mono text-[11px]">{emp.joiningDate}</span>
                      </div>
                    </div>

                    {/* Role Permissions Preview */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-amber-400" />
                        <span>Granted Permissions:</span>
                      </div>
                      <ul className="text-[11px] text-slate-300 space-y-0.5 pl-2">
                        {permissions.map((p, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-400" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Switch button */}
                  <div className="pt-3 mt-3 border-t border-slate-800">
                    <button
                      disabled={isCurrent}
                      onClick={() => switchEmployee(emp.id)}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isCurrent
                          ? 'bg-slate-800 text-slate-500 cursor-default'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{isCurrent ? 'Currently Active' : 'Switch To This User'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
