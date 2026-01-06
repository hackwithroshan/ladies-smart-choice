
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { DataTable, ColumnDef } from '../ui/data-table';
import { ArrowUpDown, MoreHorizontal } from '../Icons';

interface AdminUser extends User {
    totalSpent?: number;
    phone?: string;
}

const UserList: React.FC<{token: string | null}> = ({token}) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await fetch(getApiUrl('/api/users'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setUsers(await response.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const handleDeleteUser = async (id: string) => {
      if(!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
      try {
          const res = await fetch(getApiUrl(`/api/users/${id}`), {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if(res.ok) {
              fetchUsers();
          }
      } catch (e) { console.error(e); }
  };

  const columns: ColumnDef<AdminUser>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-zinc-900"
          onClick={() => column.toggleSorting()}
        >
          Customer
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => {
          const user = row.original;
          return (
              <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-zinc-100 flex items-center justify-center text-xs font-black text-zinc-600 border border-zinc-200">
                      {user.name.substring(0,2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                      <span className="font-bold text-zinc-900 truncate">{user.name}</span>
                      <span className="text-[10px] text-zinc-400 font-medium truncate">{user.email}</span>
                  </div>
              </div>
          );
      }
    },
    {
        accessorKey: "role",
        header: "Role",
        cell: ({ getValue }) => {
            const role = getValue() as string;
            return (
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${role === 'Super Admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}>
                    {role}
                </span>
            );
        }
    },
    {
        accessorKey: "segment",
        header: "Segment",
        cell: ({ getValue }) => {
            const segment = getValue() as string;
            return (
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${segment === 'VIP' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>
                    {segment}
                </span>
            );
        }
    },
    {
        accessorKey: "totalSpent",
        header: "Total Spend",
        cell: ({ row }) => {
            const val = row.original.totalSpent || 0;
            return <span className="font-black text-zinc-900 italic">₹{val.toLocaleString()}</span>;
        }
    },
    {
        accessorKey: "totalOrders",
        header: "Orders",
        cell: ({ getValue }) => <span className="font-bold text-zinc-700">{getValue()}</span>
    },
    {
        accessorKey: "joinDate",
        header: "Member Since",
        cell: ({ getValue }) => <span className="text-zinc-400 text-xs font-medium">{new Date(getValue()).toLocaleDateString()}</span>
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex justify-end gap-2">
             <button 
                onClick={() => handleDeleteUser(user.id)}
                className="p-2 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors"
                title="Delete User"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg>
             </button>
          </div>
        );
      }
    }
  ], []);

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900"></div>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Auditing user records...</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-black text-zinc-900 italic tracking-tighter">Identity Management</h2>
            <p className="text-xs text-zinc-500 font-medium">Manage permissions and view customer engagement statistics.</p>
        </div>
      </div>
      <DataTable 
        columns={columns} 
        data={users} 
        searchKey="name" 
        searchPlaceholder="Filter accounts by name..." 
      />
    </div>
  );
};

export default UserList;
