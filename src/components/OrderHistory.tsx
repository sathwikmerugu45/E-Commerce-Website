import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Package, Calendar, CreditCard, ArrowLeft, Eye, Download } from 'lucide-react';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  payment_intent_id: string;
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      image_url: string;
    };
  }>;
}

const OrderHistory: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (
              id,
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-700 bg-green-100';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      case 'cancelled':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Sign in to view orders</h2>
          <p className="text-gray-600 mb-8">Access your order history and track your purchases</p>
          <Link
            to="/auth"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 font-medium">Loading your order history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Error Loading Orders</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={fetchOrders}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Link
            to="/"
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-xl hover:bg-white shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Shop
          </Link>
          <div className="ml-6">
            <h1 className="text-4xl font-bold text-gray-900">Order History</h1>
            <p className="text-gray-600 mt-1">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} found
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h3>
              <p className="text-gray-600 mb-8">Start shopping to see your order history here</p>
              <Link
                to="/"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                    <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">FREE</div>
                        <div className="text-sm text-gray-500">Total Amount</div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
                          <Eye className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50">
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Items Ordered</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="h-12 w-12 object-cover rounded-lg shadow-md"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 truncate">{item.product.name}</h5>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">FREE</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.payment_intent_id && (
                    <div className="border-t border-gray-100 pt-4 mt-6">
                      <div className="flex items-center text-sm text-gray-600">
                        <CreditCard className="h-4 w-4 mr-2" />
                        <span>Payment ID: </span>
                        <span className="font-mono ml-1">{order.payment_intent_id}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;