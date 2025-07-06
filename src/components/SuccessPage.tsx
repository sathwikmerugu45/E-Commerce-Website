import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Download, Package, Calendar, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface OrderData {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
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
const SuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId && user) {
      fetchOrderData();
    } else {
      setLoading(false);
    }
  }, [sessionId, user]);

  const fetchOrderData = async () => {
    try {
      // Fetch the most recent order for this user
      const { data: orders, error: ordersError } = await supabase
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
        .order('created_at', { ascending: false })
        .limit(1);

      if (ordersError) {
        throw ordersError;
      }

      if (orders && orders.length > 0) {
        setOrderData(orders[0]);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 font-medium">Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Order Confirmed! 🎉
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Thank you for your purchase! Your order has been successfully processed and is being prepared for delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              </div>

              {orderData && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-900">#{orderData.id.slice(-8).toUpperCase()}</div>
                      <div className="text-sm text-gray-600">Order Number</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">FREE</div>
                      <div className="text-sm text-gray-600">Total Amount</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">{orderData.status.toUpperCase()}</div>
                      <div className="text-sm text-gray-600">Status</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Ordered</h3>
                    {orderData.order_items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="h-16 w-16 object-cover rounded-xl shadow-md"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">FREE</div>
                          <div className="text-sm text-gray-500 line-through">${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Order Info & Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
              <div className="space-y-4">
                {sessionId && (
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Session ID</div>
                      <div className="text-xs text-gray-500 font-mono">{sessionId}</div>
                    </div>
                  </div>
                )}
                {orderData && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Order Date</div>
                      <div className="text-sm text-gray-600">
                        {new Date(orderData.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Download className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Confirmation Email</div>
                    <div className="text-sm text-gray-600">Sent to {user?.email}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Order confirmation sent</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Processing your order</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                  <span>Preparing for shipment</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                  <span>Out for delivery</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Continue Shopping</span>
              </Link>
              
              <Link
                to="/orders"
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors font-semibold flex items-center justify-center space-x-2"
              >
                <Package className="h-5 w-5" />
                <span>View All Orders</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Thank You for Shopping With Us! 🛍️</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              We appreciate your business and hope you love your purchase. During our test phase, everything is completely FREE!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Free Shipping</h4>
                <p className="text-sm text-gray-600">On all orders worldwide</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Easy Returns</h4>
                <p className="text-sm text-gray-600">30-day return policy</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Download className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">24/7 Support</h4>
                <p className="text-sm text-gray-600">We're here to help</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@shophub.com" className="text-blue-600 hover:text-blue-700 font-medium">
              support@shophub.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;