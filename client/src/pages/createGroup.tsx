'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Users, ArrowLeft } from 'lucide-react';

export default function CreateGroup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    restaurant: '',
    location: '',
    orderTime: '',
    maxParticipants: 4,
    description: ''
  });

  const locations = [
    "University Library",
    "Student Center",
    "Engineering Building",
    "Science Hall",
    "Dorm Commons"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement group creation logic
    console.log('Creating group:', formData);
    navigate('/viewGroups');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-orange-600">UChomps</h1>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="text-gray-500" size={20} />
            <select
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Create New Group</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          {/* Restaurant Name */}
          <div>
            <label htmlFor="restaurant" className="block text-sm font-medium text-gray-700">
              Restaurant
            </label>
            <input
              type="text"
              id="restaurant"
              value={formData.restaurant}
              onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
              className="py-1.5 px-3 mt-1 block w-full rounded-md border border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <div className="mt-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
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
            <label htmlFor="orderTime" className="block text-sm font-medium text-gray-700">
              Time
            </label>
            <div className="mt-1 relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="datetime-local"
                id="orderTime"
                value={formData.orderTime}
                onChange={(e) => setFormData({ ...formData, orderTime: e.target.value })}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
