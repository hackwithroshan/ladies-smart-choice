
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { DataTable, ColumnDef } from '../ui/data-table';
import { ArrowUpDown, UserIcon as UserIco, Activity, HeartIcon, ShoppingCart, MoreHorizontal, Eye, EditPencil, Trash2, Lock } from '../Icons';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerContent, DrawerFooter } from '../ui/drawer';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { cn } from '../../utils/utils';

interface AdminUser extends User {
    totalSpent?: number;
}

const Customers: React.FC<{token: string | null}> = ({token}) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Corrected: Removed /api prefix
      const res = await fetch(getApiUrl('users'), { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setUsers(await res.json());
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer? This action is permanent.")) return;
    try {
        const res = await fetch(getApiUrl(`users/${id}`), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            fetchUsers();
        } else {
            const data = await res.json();
            alert(data.message || "Delete failed");
        }
    } catch (e) { alert("Delete failed."); }
  };

  const columns: ColumnDef<AdminUser>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Identity",
      cell: ({ row }) => (
          <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-black text-white italic border-2 border-zinc-100">
                  {row.original.name.substring(0,2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                  <span className="font-bold text-zinc-900">{row.original.name}</span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{row.original.email}</span>
              </div>
          </div>
      )
    },
    {
        accessorKey: "segment",
        header: "Segment",
        cell: ({ getValue }) => {
            const seg = String(getValue());
            return <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-2", seg === 'VIP' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-zinc-50 text-zinc-500 border-zinc-100')}>{seg}</Badge>
        }
    },
    {
        accessorKey: "totalSpent",
        header: "LTV (Revenue)",
        cell: ({ getValue }) => <span className="font-black text-zinc-900 italic">₹{Number(getValue() || 0).toLocaleString()}</span>
    },
    {
        accessorKey: "totalOrders",
        header: "Volume",
        cell: ({ getValue }) => <div className="flex items-center gap-2"><ShoppingCart className="h-3 w-3 text-zinc-400" /><span className="font-bold text-xs">{getValue() || 0}</span></div>
    },
    {
        accessorKey: "joinDate",
        header: "Joined",
        cell: ({ getValue }) => <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{new Date(getValue() as string).toLocaleDateString()}</span>
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Action</div>,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex justify-end pr-2" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu 
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            >
              <DropdownMenuLabel>Account Controls</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                <Eye className="mr-2 h-3.5 w-3.5" /> View Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} variant="destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete User
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        );
      }
    }
  ], [token]);

  const filteredUsers = useMemo(() => {
      if (activeTab === "all") return users;
      return users.filter(u => (u.segment || '').toLowerCase() === activeTab.toLowerCase());
  }, [users, activeTab]);

  return (
    <div className="space-y-6">
      <DataTable 
        columns={columns} 
        data={filteredUsers} 
        searchKey="name" 
        searchPlaceholder="Customer search..." 
        onRowClick={setSelectedUser}
        tabs={[
            { value: "all", label: "Directory", count: users.length },
            { value: "vip", label: "VIP Hub", count: users.filter(u => u.segment === 'VIP').length },
            { value: "high-value", label: "Growth", count: users.filter(u => u.segment === 'High-Value').length }
        ]}
        onTabChange={setActiveTab}
      />

      <Drawer isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="CRM Profile">
         {selectedUser && (
             <div className="space-y-8">
                 <DrawerHeader className="border-b bg-zinc-50/50 pb-8 items-center text-center flex flex-col">
                    <div className="h-20 w-20 rounded-full bg-zinc-900 flex items-center justify-center text-2xl font-black text-white italic border-4 border-white shadow-xl mb-4">
                        {selectedUser.name.substring(0,2).toUpperCase()}
                    </div>
                    <DrawerTitle>{selectedUser.name}</DrawerTitle>
                    <DrawerDescription>Member since {new Date(selectedUser.joinDate).getFullYear()}</DrawerDescription>
                    <div className="flex gap-4 mt-6 w-full">
                        <div className="bg-white p-3 rounded-2xl border border-zinc-100 flex-1 shadow-sm"><p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Lifetime</p><p className="text-lg font-black italic">₹{selectedUser.totalSpent?.toLocaleString()}</p></div>
                        <div className="bg-white p-3 rounded-2xl border border-zinc-100 flex-1 shadow-sm"><p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Orders</p><p className="text-lg font-black italic">{selectedUser.totalOrders}</p></div>
                    </div>
                 </DrawerHeader>

                 <DrawerContent>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Interaction History</h4>
                            <div className="space-y-2">
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center"><div className="flex items-center gap-3"><Activity className="h-4 w-4 text-zinc-400" /><p className="text-xs font-bold">Last Active</p></div><p className="text-[10px] font-black uppercase text-zinc-500">2 Days Ago</p></div>
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center"><div className="flex items-center gap-3"><HeartIcon className="h-4 w-4 text-zinc-400" /><p className="text-xs font-bold">Wishlist Items</p></div><p className="text-[10px] font-black uppercase text-zinc-500">12 Products</p></div>
                            </div>
                        </div>
                    </div>
                 </DrawerContent>

                 <DrawerFooter>
                    <Button variant="outline" className="flex-1 font-bold text-[11px] uppercase tracking-widest">Message</Button>
                    <Button className="flex-1 font-black text-[11px] uppercase tracking-widest bg-zinc-900">View Full Orders</Button>
                 </DrawerFooter>
             </div>
         )}
      </Drawer>
    </div>
  );
};

export default Customers;
