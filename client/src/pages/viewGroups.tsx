"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Clock, Users, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import OrderService from "services/orderService";
import VerificationModal from "../components/VerificationModal";

export default function ViewGroups() {
  const navigate = useNavigate();
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState("University Library");

  useEffect(() => {
    const fetchOrders = async () => {
      const service = new OrderService();
      await service.getOrders();
    };
    fetchOrders();
  }, []);

  // Sample data for order cards
  const orders = [
    {
      id: 1,
      restaurant: "Burrito Bros",
      time: "15 min",
      orderTime: "7:15 PM",
      participants: 3,
    },
    {
      id: 2,
      restaurant: "Pizza Palace",
      time: "25 min",
      orderTime: "7:25 PM",
      participants: 2,
    },
    {
      id: 3,
      restaurant: "Sushi Express",
      time: "20 min",
      orderTime: "7:20 PM",
      participants: 4,
    },
    {
      id: 4,
      restaurant: "Thai Delight",
      time: "90 min",
      orderTime: "8:30 PM",
      participants: 2,
    },
    {
      id: 5,
      restaurant: "Sandwich Shop",
      time: "10 min",
      orderTime: "7:10 PM",
      participants: 3,
    },
  ];

  const locations = [
    "University Library",
    "Student Center",
    "Engineering Building",
    "Science Hall",
    "Dorm Commons",
  ];

  const handleCreateClick = () => {
    setIsVerificationOpen(true);
  };

  const handleVerified = () => {
    // Navigate to create group page after verification
    navigate("/groups/create");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header with location dropdown */}
      <header className="sticky top-0 z-10 bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-orange-600">UChomps</h1>
          <div className="flex items-center space-x-2">
            <MapPin className="text-gray-500" size={20} />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main content with order cards */}
      <main className="container mx-auto px-4 py-6 flex-grow">
        <h2 className="text-xl font-semibold mb-4">
          Active Groups at {selectedLocation}
        </h2>

        {orders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-l-4 border-orange-500"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">{order.restaurant}</h3>
                  <div className="flex items-center text-gray-600">
                    <Users size={16} className="mr-1" />
                    <span>{order.participants}</span>
                  </div>
                </div>
                <div className="flex items-center text-gray-600 mb-3">
                  <Clock size={16} className="mr-1" />
                  {parseInt(order.time) < 60 ? (
                    <span>Ordering in {order.time}</span>
                  ) : (
                    <span>Ordering at {order.orderTime}</span>
                  )}
                </div>
                <button className="mt-2 w-full py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors font-medium">
                  Join
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No active groups at this location.</p>
            <p className="text-gray-500">Create a new group to get started!</p>
          </div>
        )}
      </main>

      {/* Fixed Create Group button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={handleCreateClick}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-orange-700 transition-colors font-medium"
        >
          <PlusCircle size={20} />
          <span>Create Group</span>
        </button>
      </div>

      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        onVerified={handleVerified}
        groupData={{
          restaurant: "",
          location: selectedLocation,
          orderTime: new Date().toISOString(),
          maxParticipants: 4,
        }}
      />
    </div>
  );
}
