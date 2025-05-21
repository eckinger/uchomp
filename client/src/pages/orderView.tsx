'use client';

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, Phone, Mail } from 'lucide-react';
import OrderService from '../services/orderService';

interface Participant {
  id: string;
  name: string;
  cell: string;
  email: string;
  is_owner: boolean;
}

interface OrderDetails {
  id: string;
  owner_id: string;
  restaurant: string;
  expiration: string;
  location: string;
  is_open: boolean;
  participants: Participant[];
}

export default function OrderView() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const orderService = new OrderService();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await orderService.getOrderDetails(orderId);
      if (result.success) {
        setOrderDetails(result.orderDetails);
      } else {
        setError(result.error || 'Failed to load order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto mt-8 p-4 bg-red-50 rounded-lg text-red-700">
          {error || 'Order not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/view')}
            className="mr-3 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-orange-600">UChomps</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {!orderDetails.is_open && (
            <div className="bg-orange-100 text-orange-800 p-4 rounded-lg mb-6 shadow">
              <h4 className="font-bold text-md mb-2">🎉 You found other students to order food with and saved everyone money!</h4>
              <p className="text-sm">
                You are the group owner responsible for contacting everyone and placing the order. <br /> <span className="font-bold">Create your group chat NOW.</span> You won't be able to see contact details after leaving this page.
              </p>
            </div>
          )}

          {/* Restaurant Info Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-2">{orderDetails.restaurant}</h2>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin size={18} className="mr-2" />
              <span>{orderDetails.location}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock size={18} className="mr-2" />
              <span>{formatTime(orderDetails.expiration)}</span>
            </div>
          </div>

          {/* Participants Card */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Participants</h3>
                <div className="flex items-center text-gray-600">
                  <Users size={18} className="mr-1" />
                  <span>{orderDetails.participants.length}</span>
                </div>
              </div>
            </div>

            {/* Participant List */}
            <div className="divide-y">
              {orderDetails.participants.map((participant, index) => (
                <div key={participant.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="h-6 w-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-sm font-medium mr-3">
                        {index + 1}
                      </div>
                      <span className="font-medium">
                        {participant.id === userId ? 'You' : participant.name || 'Anonymous'}
                      </span>
                      {participant.is_owner && (
                        <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                          Owner
                        </span>
                      )}
                    </div>
                  </div>
                  {!participant.is_owner && (
                    <div className="text-sm text-gray-600 pl-9">
                      {participant.cell}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
