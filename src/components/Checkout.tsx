import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const Checkout: React.FC = () => {
  const { items, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: user?.email || '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to complete your order');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    
    try {
      // Get the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Failed to authenticate user');
      }

      // Create line items for Stripe
      const lineItems = items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.name,
            description: `Quantity: ${item.quantity}`,
            images: [item.product.image_url],
          },
          unit_amount: 0, // $0.00 for test phase
        },
        quantity: item.quantity,
      }));

      // Create checkout session
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          line_items: lineItems,
          customer_email: user.email,
          success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/checkout`,
          metadata: {
            user_id: user.id,
            shipping_info: JSON.stringify(shippingInfo),
            cart_items: JSON.stringify(items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.product.price
            })))
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout process');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to checkout</h2>
          <button
            onClick={() => navigate('/auth')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-xl hover:bg-white shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Cart
          </button>
          <div className="ml-6">
            <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-1">Complete your FREE order</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ArrowLeft className="h-5 w-5 text-blue-600 rotate-180" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Shipping Information</h2>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-800 font-semibold">🎉 Everything is FREE!</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                No payment required during our special test phase
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={shippingInfo.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={shippingInfo.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  value={shippingInfo.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={shippingInfo.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    required
                    value={shippingInfo.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  required
                  value={shippingInfo.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing Your FREE Order...</span>
                  </>
                ) : (
                  <>
                    <span>🎉 Place FREE Order</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 sticky top-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Order Summary</h2>
            </div>
            
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="h-16 w-16 object-cover rounded-xl shadow-md"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                          FREE
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-green-600 text-lg">
                    FREE
                  </span>
                </div>
              ))}
              
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal ({items.length} items)</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-gray-900">Total:</span>
                    <span className="text-3xl font-bold text-green-600">FREE</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">🎉 You save ${(Math.random() * 500 + 100).toFixed(2)} during our test phase!</p>
                </div>
              </div>
              
              <div className="mt-6 space-y-3 pt-6 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Free shipping worldwide
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  30-day money-back guarantee
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  24/7 customer support
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Instant delivery
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;