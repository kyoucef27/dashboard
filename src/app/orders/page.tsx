'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

// Define Order type
interface OrderItem {
  productId: string;
  quantity: number;
  product?: any; // Optional product details
}

interface Customer {
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  phone?: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  total: number;
  customer: Customer;
  timestamp: string;
  status: 'pending' | 'delivered' | 'returned';
  deliveryDate?: string;
  returnDate?: string;
  statusHistory: {
    status: string;
    timestamp: string;
    note?: string;
  }[];
  createdAt: string;
}

// Define Analytics type
interface Analytics {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  weeklyData: {
    date: string;
    orders: number;
    revenue: number;
  }[];
  monthlyData: {
    month: string;
    orders: number;
    revenue: number;
  }[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // State variables
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  
  // Filter states
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // Fetch orders
  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrders();
      fetchAnalytics();
    }
  }, [status]);
  
  // Apply filters when tab or search changes
  useEffect(() => {
    applyFilters();
  }, [orders, activeTab, searchTerm, startDate, endDate]);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/order');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }
      
      // Fetch product details for each order item
      const ordersWithProducts = await Promise.all(
        data.orders.map(async (order: Order) => {
          const itemsWithDetails = await Promise.all(
            order.items.map(async (item) => {
              try {
                const productResponse = await fetch(`/api/products/${item.productId}`);
                const productData = await productResponse.json();
                
                return {
                  ...item,
                  product: productResponse.ok ? productData.product : null
                };
              } catch (error) {
                console.error(`Error fetching product ${item.productId}:`, error);
                return item;
              }
            })
          );
          
          return {
            ...order,
            items: itemsWithDetails
          };
        })
      );
      
      setOrders(ordersWithProducts);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/order/analytics');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch analytics');
      }
      
      setAnalytics(data.statistics);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...orders];
    
    // Filter by tab (status)
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.status === activeTab);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.customer.name?.toLowerCase().includes(term) ||
        order.customer.email?.toLowerCase().includes(term) ||
        order._id.toLowerCase().includes(term)
      );
    }
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start && orderDate <= end;
      });
    } else if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start;
      });
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate <= end;
      });
    }
    
    setFilteredOrders(filtered);
  };
  
  const handleStatusChange = async (orderId: string, newStatus: 'pending' | 'delivered' | 'returned') => {
    try {
      const response = await fetch(`/api/order/status/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          note: `Order marked as ${newStatus} by admin`
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to update order to ${newStatus}`);
      }
      
      // Update orders in state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? { ...order, ...data.order } : order
        )
      );
      
      // Refresh analytics
      fetchAnalytics();
      
      // Close modal if open
      if (showModal && selectedOrder?._id === orderId) {
        setSelectedOrder(data.order);
      }
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating order status');
      console.error('Error updating order status:', err);
    }
  };
  
  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };
  
  // Helper function to set date ranges
  const setDateRange = (range: 'today' | 'week' | 'month') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    setEndDate(todayStr);
    
    if (range === 'today') {
      setStartDate(todayStr);
    } else if (range === 'week') {
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      setStartDate(lastWeek.toISOString().split('T')[0]);
    } else if (range === 'month') {
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      setStartDate(lastMonth.toISOString().split('T')[0]);
    }
  };
  
  // Function to get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Orders Management</h1>
        
        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-500">Total Orders</h3>
              <p className="text-3xl font-bold">{analytics.totalOrders}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-500">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600">{analytics.pendingOrders}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-500">Delivered</h3>
              <p className="text-3xl font-bold text-green-600">{analytics.deliveredOrders}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-500">Returned</h3>
              <p className="text-3xl font-bold text-red-600">{analytics.returnedOrders}</p>
            </div>
          </div>
        )}
        
        {/* Status Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('delivered')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'delivered'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Delivered
            </button>
            <button
              onClick={() => setActiveTab('returned')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'returned'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Returned
            </button>
          </nav>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="w-full md:w-64 bg-white p-4 rounded-lg shadow">
            <h2 className="font-medium text-lg mb-4">Filters</h2>
            
            <div className="mb-4">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Customer
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name or Email"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div className="flex flex-col gap-2 mt-4">
              <h3 className="font-medium text-sm mb-1">Quick Filters</h3>
              <button
                onClick={() => setDateRange('today')}
                className="w-full bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded text-sm"
              >
                Today
              </button>
              <button
                onClick={() => setDateRange('week')}
                className="w-full bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded text-sm"
              >
                This Week
              </button>
              <button
                onClick={() => setDateRange('month')}
                className="w-full bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded text-sm"
              >
                This Month
              </button>
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSearchTerm('');
                  setActiveTab('all');
                }}
                className="w-full bg-red-100 hover:bg-red-200 text-red-800 py-2 px-4 rounded text-sm mt-2"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          {/* Orders Table */}
          <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Loading orders...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-red-700 bg-red-100 border border-red-400 rounded">
                {error}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No orders found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer" onClick={() => openOrderDetails(order)}>
                          #{order._id.substring(order._id.length - 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">{order.customer.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.total} DZD
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                          <div className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => openOrderDetails(order)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                            {order.status === 'pending' && (
                              <button 
                                onClick={() => handleStatusChange(order._id, 'delivered')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Mark Delivered
                              </button>
                            )}
                            {order.status === 'delivered' && (
                              <button 
                                onClick={() => handleStatusChange(order._id, 'returned')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Mark Returned
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900">
                  Order #{selectedOrder._id.substring(selectedOrder._id.length - 8)}
                </h2>
                <button 
                  onClick={closeModal} 
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Information</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <p><span className="font-medium">Name:</span> {selectedOrder.customer.name || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {selectedOrder.customer.email || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedOrder.customer.phone || 'N/A'}</p>
                    <p><span className="font-medium">Address:</span> {selectedOrder.customer.address || 'N/A'}</p>
                    <p><span className="font-medium">City:</span> {selectedOrder.customer.city || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Order Details</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <p>
                      <span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    </p>
                    <p><span className="font-medium">Order Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    {selectedOrder.deliveryDate && (
                      <p><span className="font-medium">Delivered:</span> {new Date(selectedOrder.deliveryDate).toLocaleString()}</p>
                    )}
                    {selectedOrder.returnDate && (
                      <p><span className="font-medium">Returned:</span> {new Date(selectedOrder.returnDate).toLocaleString()}</p>
                    )}
                    <p><span className="font-medium">Total Amount:</span> {selectedOrder.total} DZD</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Order Items</h3>
                <div className="bg-gray-50 rounded overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {item.product?.pictures && item.product.pictures[0] && (
                                <div className="flex-shrink-0 h-10 w-10 mr-4">
                                  <img 
                                    src={item.product.pictures[0]} 
                                    alt={item.product?.name || 'Product image'} 
                                    className="h-10 w-10 object-cover rounded"
                                  />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.product?.name || `Product ID: ${item.productId}`}
                                </div>
                                {item.product?.price && (
                                  <div className="text-sm text-gray-500">
                                    {item.product.price} DZD
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Status History</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <ul className="space-y-3">
                    {selectedOrder.statusHistory.map((history, index) => (
                      <li key={index} className="flex items-start">
                        <div className={`flex-shrink-0 h-5 w-5 rounded-full mt-1 ${
                          history.status === 'pending' ? 'bg-yellow-500' :
                          history.status === 'delivered' ? 'bg-green-500' :
                          history.status === 'returned' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(history.timestamp).toLocaleString()}
                          </p>
                          {history.note && (
                            <p className="text-sm text-gray-500 italic">{history.note}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
                
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder._id, 'delivered')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Mark as Delivered
                  </button>
                )}
                
                {selectedOrder.status === 'delivered' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder._id, 'returned')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Mark as Returned
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
