"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Clock, Users, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import OrderService from "services/orderService";
import VerificationModal from "../components/VerificationModal";

interface Order {
  id: number;
  restaurant: string;
  expiration: string;
  loc: string;
  participants?: string[];
  owner_id: string;
}

export default function ViewGroups() {
  const navigate = useNavigate();
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState("University Library");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const orderService = new OrderService();

  const locations = [
    "Regenstein Library",
    "Harper Library",
    "John Crerar Library",
  ];

  // Fetch orders when component mounts or location changes
  useEffect(() => {
    fetchOrders();
  }, [selectedLocation]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await orderService.getOrders();

      // Filter orders by selected location if needed
      const filteredOrders = response.filter(
        (order: Order) => order.loc === selectedLocation
      );

      setOrders(filteredOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load groups. Please try again later.");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
    const userEmail = localStorage.getItem("userEmail");
    const userName = localStorage.getItem("userName");

    // Check if user is logged in with profile
    if (!userEmail) {
      setIsVerificationOpen(true);
    } else if (!userName) {
      // User verified email but hasn't set profile
      navigate("/record-info");
    } else {
      // User has email and profile, go directly to create page
      navigate("/create");
    }
  };

  const handleVerified = () => {
    // Check if user has a profile
    const userName = localStorage.getItem("userName");

    if (!userName) {
      // User needs to fill profile
      navigate("/record-info");
    } else {
      // User already has a profile
      navigate("/create");
    }
  };

  // Format the time remaining for an order
  const formatTimeRemaining = (expirationDate: string): string => {
    const expiration = new Date(expirationDate);
    const now = new Date();
    const minutesRemaining = Math.floor(
      (expiration.getTime() - now.getTime()) / 60000
    );

    if (minutesRemaining < 60) {
      return `${minutesRemaining} min`;
    } else {
      return expiration.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
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

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : orders.length > 0 ? (
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
                    <span>
                      {order.participants ? order.participants.length : 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center text-gray-600 mb-3">
                  <Clock size={16} className="mr-1" />
                  {parseInt(formatTimeRemaining(order.expiration)) < 60 ? (
                    <span>
                      Ordering in {formatTimeRemaining(order.expiration)}
                    </span>
                  ) : (
                    <span>
                      Ordering at {formatTimeRemaining(order.expiration)}
                    </span>
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
