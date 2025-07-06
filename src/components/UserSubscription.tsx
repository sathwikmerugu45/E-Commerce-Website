import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Crown, Calendar, CreditCard } from 'lucide-react';
import { getProductByPriceId } from '../stripe-config';

interface SubscriptionData {
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

const UserSubscription: React.FC = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Crown className="h-6 w-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Subscription Status</h3>
        </div>
        <p className="text-gray-600">No active subscription</p>
      </div>
    );
  }

  const product = subscription.price_id ? getProductByPriceId(subscription.price_id) : null;
  const isActive = ['active', 'trialing'].includes(subscription.subscription_status);
  const isPastDue = subscription.subscription_status === 'past_due';
  const isCanceled = subscription.subscription_status === 'canceled';

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'trialing':
        return 'text-blue-600 bg-blue-100';
      case 'past_due':
        return 'text-yellow-600 bg-yellow-100';
      case 'canceled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Crown className={`h-6 w-6 ${isActive ? 'text-yellow-500' : 'text-gray-400'}`} />
        <h3 className="text-lg font-semibold text-gray-900">Subscription Status</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Plan:</span>
          <span className="font-semibold text-gray-900">
            {product?.name || 'Unknown Plan'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.subscription_status)}`}>
            {subscription.subscription_status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {subscription.current_period_start && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Current Period:</span>
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
              </div>
              {subscription.cancel_at_period_end && (
                <div className="text-sm text-red-600">Cancels at period end</div>
              )}
            </div>
          </div>
        )}

        {subscription.payment_method_brand && subscription.payment_method_last4 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Payment Method:</span>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <span className="font-semibold text-gray-900">
                {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
              </span>
            </div>
          </div>
        )}

        {isPastDue && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">Payment Required</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Your subscription payment is past due. Please update your payment method.
            </p>
          </div>
        )}

        {isCanceled && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">Subscription Canceled</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              Your subscription has been canceled. You can reactivate it at any time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSubscription;