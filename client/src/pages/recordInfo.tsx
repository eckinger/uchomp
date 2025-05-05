// @ts-nocheck
import React, { useState } from 'react';
import { ArrowLeft, Shield, Mail, Phone, Info } from 'lucide-react';

interface RecordInfoProps {
  onBack?: () => void;
  onContinue?: (data: { name: string; phoneNumber: string }) => void;
}

interface FormData {
  name: string;
  phoneNumber: string;
}

interface FormErrors {
  name?: string;
  phoneNumber?: string;
}

const RecordInfo: React.FC<RecordInfoProps> = ({
  onBack = () => window.history.back(),
  onContinue = () => { }
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      // TODO: Implement API call to save user info
      // await saveUserInfo(formData);
      onContinue(formData);
    } catch (error) {
      setErrors({
        name: 'Failed to save information. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <button
            onClick={onBack}
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
              <Info size={30} className="text-orange-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Welcome to UChomps!</h2>
            <p className="text-gray-600">Please provide a few details before you start.</p>
          </div>

          <div className="space-y-5">
            {/* Why we collect information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold mb-2 text-blue-800">Why do we need this information?</h3>
              <p className="text-sm text-blue-700">
                We collect your contact information to facilitate group food ordering. Your email is used for verification, and your phone number helps order participants contact each other. We never share your information with third parties.
              </p>
            </div>

            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Phone Input */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="(123) 456-7890"
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  disabled={isLoading}
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                We'll only share this with people you're ordering with.
              </p>
            </div>

            <div className="flex items-center mt-2 text-sm text-gray-600">
              <Shield size={16} className="mr-1 text-gray-500" />
              <p>Your information is stored securely.</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !formData.name || !formData.phoneNumber}
              className={`w-full py-3 rounded-md font-medium transition-colors ${isLoading || !formData.name || !formData.phoneNumber
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RecordInfo;
