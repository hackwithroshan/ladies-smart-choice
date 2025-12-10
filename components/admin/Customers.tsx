
import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';

// Extend User type locally to include backend-calculated stats and contact info
interface AdminUser extends User {
    totalSpent?: number;
    phone?: string;
    shippingAddress?: {
        address: string;
        city: string;
        postalCode: string;
        country: string;
    };
}

const Customers: React.FC<{token: string | null}> = ({token}) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRole, setEditRole] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await fetch(getApiUrl('/api/users'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const getInitials = (name: string) => {
      if (!name) return 'U';
      const parts = name.split(' ').filter(Boolean);
      if (parts.length > 1) {
          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
  };

  // --- Actions ---

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
  };

  const handleExportCSV = () => {
      const headers = ['ID,Name,Email,Role,Join Date,Total Orders,Total Spent,Segment'];
      const rows = users.map(u => 
          `${u.id},"${u.name}",${u.email},${u.role},${new Date(u.joinDate).toLocaleDateString()},${u.totalOrders},${u.totalSpent || 0},${u.segment}`
      );
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "customers_list.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const openUserModal = (user: AdminUser) => {
      setSelectedUser(user);
      setEditRole(user.role);
      setIsModalOpen(true);
  };

  const handleUpdateRole = async () => {
      if (!selectedUser) return;
      setActionLoading(true);
      try {
          const res = await fetch(getApiUrl(`/api/users/${selectedUser.id}`), {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ role: editRole })
          });
          if (res.ok) {
              const updated = await res.json();
              setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated, totalSpent: u.totalSpent, segment: u.segment } : u)); // Preserve stats
              setIsModalOpen(false);
              alert('User role updated successfully.');
          } else {
              alert('Failed to update user.');
          }
      } catch (error) {
          console.error(error);
      } finally {
          setActionLoading(false);
      }
  };

  const handleDeleteUser = async () => {
      if (!selectedUser) return;
      if (!window.confirm(`Are you sure you want to delete ${selectedUser.name}? This action cannot be undone.`)) return;
      
      setActionLoading(true);
      try {
          const res = await fetch(getApiUrl(`/api/users/${selectedUser.id}`), {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
              setIsModalOpen(false);
          } else {
              alert('Failed to delete user.');
          }
      } catch (error) {
          console.error(error);
      } finally {
          setActionLoading(false);
      }
  };

  // --- Filtering ---
  const filteredUsers = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading customers...</div>;

  return (
    <div className="space-y-6">
        {/* Header & Tools */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Customer Management</h2>
          <div className="flex space-x-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input 
                    type="text" 
                    placeholder="Search by name or email..." 
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
            </div>
            <button 
                onClick={handleExportCSV}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {['VIP', 'New', 'Returning', 'High-Value'].map(segment => {
                const count = users.filter(u => u.segment === segment).length;
                return (
                    <div key={segment} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-orange-500 transition-all cursor-pointer group">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-orange-500">{segment}</h4>
                        <p className="text-2xl font-extrabold text-gray-800">{count}</p>
                    </div>
                )
            })}
        </div>

        {/* Users Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Segment</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Join Date</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Spent</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                                {user.avatarUrl ? (
                                    <img className="h-10 w-10 rounded-full object-cover border border-gray-200" src={user.avatarUrl} alt={user.name} />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center text-sm font-bold text-white">
                                        {getInitials(user.name)}
                                    </div>
                                )}
                            </div>
                            <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'Super Admin' || user.role === 'Manager' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                {user.role}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.segment === 'VIP' ? 'bg-amber-100 text-amber-800' : 
                                user.segment === 'High-Value' ? 'bg-blue-100 text-blue-800' :
                                user.segment === 'Returning' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {user.segment}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.joinDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-center">{user.totalOrders}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold text-right">
                            {user.totalSpent ? `₹${user.totalSpent.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => openUserModal(user)} className="text-blue-600 hover:text-blue-900 font-semibold bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 transition-colors">
                                Manage
                            </button>
                        </td>
                    </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-8 text-gray-500">No customers found matching your search.</td></tr>
                    )}
                </tbody>
                </table>
            </div>
        </div>

        {/* --- User Details Modal --- */}
        {isModalOpen && selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                    
                    {/* Modal Header */}
                    <div className="bg-gray-50 px-6 py-6 border-b border-gray-200">
                        <div className="flex justify-between items-start">
                             <div className="flex items-center gap-4">
                                {selectedUser.avatarUrl ? (
                                    <img className="h-16 w-16 rounded-full border-4 border-white shadow-md object-cover" src={selectedUser.avatarUrl} alt={selectedUser.name} />
                                ) : (
                                    <div className="h-16 w-16 rounded-full border-4 border-white shadow-md bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center text-xl font-bold text-white">
                                        {getInitials(selectedUser.name)}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedUser.name}</h3>
                                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-0.5 rounded-full">{selectedUser.role}</span>
                                        <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-0.5 rounded-full">{selectedUser.segment}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                                <p className="text-xs text-gray-500 uppercase font-bold">Lifetime Spend</p>
                                <p className="text-xl font-bold text-green-600 mt-1">₹{(selectedUser.totalSpent || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                                <p className="text-xs text-gray-500 uppercase font-bold">Total Orders</p>
                                <p className="text-xl font-bold text-blue-600 mt-1">{selectedUser.totalOrders}</p>
                            </div>
                        </div>

                        {/* Contact & Address */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Contact Information</h4>
                                <div className="space-y-2 text-sm">
                                    <p><strong className="font-medium text-gray-600 w-20 inline-block">Email:</strong> {selectedUser.email}</p>
                                    <p><strong className="font-medium text-gray-600 w-20 inline-block">Phone:</strong> {selectedUser.phone || 'N/A'}</p>
                                    <p><strong className="font-medium text-gray-600 w-20 inline-block">Joined:</strong> {new Date(selectedUser.joinDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Last Known Address</h4>
                                {selectedUser.shippingAddress ? (
                                    <div className="text-sm text-gray-800 leading-relaxed">
                                        <p>{selectedUser.shippingAddress.address}</p>
                                        <p>{selectedUser.shippingAddress.city}, {selectedUser.shippingAddress.postalCode}</p>
                                        <p>{selectedUser.shippingAddress.country}</p>
                                    </div>
                                ) : <p className="text-sm text-gray-400 italic">No address on file.</p>}
                                <p className="text-xs text-gray-400 mt-1">(From most recent order)</p>
                            </div>
                        </div>


                        {/* Management Section */}
                        <div className="border-t border-gray-200 pt-6">
                            <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">Account Management</h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Change User Role</label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={editRole} 
                                            onChange={(e) => setEditRole(e.target.value)}
                                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="User">User (Standard)</option>
                                            <option value="Staff">Staff</option>
                                            <option value="Editor">Editor</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Super Admin">Super Admin</option>
                                        </select>
                                        <button 
                                            onClick={handleUpdateRole}
                                            disabled={actionLoading}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            Update
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-between items-center border-t border-gray-100 mt-4 bg-red-50 p-3 rounded-lg border border-red-200">
                                    <div>
                                        <p className="text-sm font-medium text-red-700">Danger Zone</p>
                                        <p className="text-xs text-red-600">This action cannot be undone.</p>
                                    </div>
                                    <button 
                                        onClick={handleDeleteUser}
                                        disabled={actionLoading}
                                        className="bg-white border border-red-300 text-red-600 hover:bg-red-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Delete User
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Customers;