'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ArrowLeft, Users } from 'lucide-react';
import OrderService from '../services/orderService';

export default function CreateGroup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orderService = new OrderService();
  const [formData, setFormData] = useState({
    restaurant: '',
    loc: '',
    orderTime: ''
  });

  // Get today's date at midnight for min, and 11:30 PM for max
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 30, 0, 0);

  // Format dates for datetime-local input
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Round a date to the nearest 30 minutes and ensure it's within bounds
  const roundToNearestThirtyMinutes = (date: Date) => {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.round(minutes / 30) * 30;
    date.setMinutes(roundedMinutes, 0, 0);

    // Ensure the time is within bounds
    if (date < today) {
      return today;
    } else if (date > todayEnd) {
      return todayEnd;
    }
    return date;
  };

  // Handle time input changes
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const roundedDate = roundToNearestThirtyMinutes(selectedDate);
    setFormData(prev => ({ ...prev, orderTime: formatDateForInput(roundedDate) }));
  };

  // Set initial orderTime to next 30-min interval if not set
  useEffect(() => {
    if (!formData.orderTime) {
      const now = new Date();
      const roundedDate = roundToNearestThirtyMinutes(now);
      setFormData(prev => ({ ...prev, orderTime: formatDateForInput(roundedDate) }));
    }
  }, []);

  const locations = [
    "Regenstein Library",
    "Harper Library",
    "John Crerar Library"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('You must be logged in to create a group. Please verify your email first.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Convert the date to ISO format for the API
      // Ensure timezone is properly handled by creating a Date object
      const orderDate = new Date(formData.orderTime);
      const expirationDate = orderDate.toISOString();

      const result = await orderService.createOrder(
        userId,
        formData.restaurant,
        expirationDate,
        formData.loc
      );

      if (result.success) {
        navigate('/view');
      } else {
        setError(result.error || 'Failed to create group. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while creating the group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-orange-600">UChomps</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <Users size={30} className="text-orange-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Create Group</h2>
            <p className="text-gray-600">Set up a new group order for your location.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Restaurant Name */}
            <div>
              <label htmlFor="restaurant" className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                id="restaurant"
                value={formData.restaurant}
                onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 border-gray-300"
                placeholder="Enter restaurant name"
                required
                disabled={isLoading}
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="loc" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  id="loc"
                  value={formData.loc}
                  onChange={(e) => setFormData({ ...formData, loc: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 border-gray-300"
                  required
                  disabled={isLoading}
                >
                  <option value="">Select a location</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Order Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <div className="w-full px-3 py-1.5 border rounded-md bg-gray-50 text-gray-700 border-gray-300">
                    {today.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    id="orderTime"
                    value={formData.orderTime.split('T')[1]?.slice(0, 5) || ''}
                    onChange={(e) => {
                      const currentDate = today.toISOString().split('T')[0];
                      setFormData(prev => ({
                        ...prev,
                        orderTime: `${currentDate}T${e.target.value}:00`
                      }));
                    }}
                    className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 border-gray-300"
                    required
                    disabled={isLoading}
                  >
                    <option value="">Select time</option>
                    {Array.from({ length: 48 }, (_, i) => {
                      const minutes = i * 30;
                      const hour = Math.floor(minutes / 60);
                      const minute = minutes % 60;
                      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                    }).filter(time => {
                      // Only show times between current time (rounded up to next 30 min) and 23:30
                      const now = new Date();
                      const currentMinutes = now.getHours() * 60 + now.getMinutes();
                      const roundedCurrentMinutes = Math.ceil(currentMinutes / 30) * 30;
                      const timeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);

                      return timeMinutes >= roundedCurrentMinutes && time <= '23:30';
                    }).map(time => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Choose when you plan to place the group order.
              </p>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading || !formData.restaurant || !formData.loc || !formData.orderTime}
                className={`w-full py-3 rounded-md font-medium transition-colors ${isLoading || !formData.restaurant || !formData.loc || !formData.orderTime
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
              >
                {isLoading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 
