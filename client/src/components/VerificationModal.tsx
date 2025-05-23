// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { X, Mail, Shield } from 'lucide-react';
import UserService from '../services/userService';
import { useNavigate } from 'react-router-dom';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: () => void;
  action: 'create' | 'join';
  groupData?: {
    restaurant: string;
    location: string;
    orderTime: string;
    maxParticipants: number;
  };
  orderId?: string;
}

const VerificationModal: React.FC<VerificationModalProps> = ({ isOpen, onClose, onVerified = () => { }, action, groupData, orderId }) => {
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const userService = new UserService();
  const navigate = useNavigate();

  // Effect to handle countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  if (!isOpen) return null;

  const handleSubmitEmail = async () => {
    if (!email) return;

    // Validate uchicago.edu email
    if (!email.toLowerCase().endsWith('@uchicago.edu')) {
      setError('Please use your @uchicago.edu email address.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await userService.sendCode(email);
      if (result.success) {
        setStage('code');
        setResendTimer(60); // Start the countdown when code is first sent
      } else {
        setError(result.error || 'Failed to send verification code. Please try again.');
      }
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostVerification = async () => {
    // Check localStorage first
    const localName = localStorage.getItem('userName');
    const localPhone = localStorage.getItem('userPhone');

    // If we have local profile data, proceed with the appropriate action
    if (localName && localPhone) {
      if (action === 'create') {
        navigate('/create');
      } else if (action === 'join' && orderId) {
        localStorage.setItem('pendingJoinOrderId', orderId);
        onVerified();
      }
      onClose();
      return;
    }

    // If no local data, check with backend
    const profileCheck = await userService.checkProfileCompletion(email);

    if (profileCheck.success) {
      if (profileCheck.hasProfile) {
        if (action === 'create') {
          navigate('/create');
        } else if (action === 'join' && orderId) {
          localStorage.setItem('pendingJoinOrderId', orderId);
          onVerified();
        }
        onClose();
      } else {
        localStorage.setItem('postProfileAction', action);
        if (action === 'join' && orderId) {
          localStorage.setItem('pendingJoinOrderId', orderId);
        }
        navigate('/record-info');
      }
    } else {
      setError('Failed to check profile status. Please try again.');
    }
  };

  const handleVerifyCode = async () => {
    if (!code) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await userService.verify(email, code);
      console.log('Verification response:', result);
      if (result.success) {
        localStorage.setItem('userEmail', email);
        if (result.id) {
          localStorage.setItem('userId', result.id);
          await handlePostVerification();
        } else {
          console.error('No user ID found in response:', result);
          setError('Failed to get user ID. Please try again.');
        }
      } else {
        setError(result.error || 'Invalid verification code. Please try again.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    try {
      setIsResending(true);
      setError(null);
      const result = await userService.sendCode(email);
      if (result.success) {
        setResendTimer(60); // Reset the countdown after successful resend
      } else {
        setError(result.error || 'Failed to resend code. Please try again.');
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md z-10 relative mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {stage === 'email' ? 'Verify UChicago Email' : 'Enter Verification Code'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {stage === 'email' ? (
            <div>
              <div className="mb-4">
                <p className="text-gray-600 mb-3">
                  We'll send a verification code to your UChicago email to verify your student status.
                </p>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null); // Clear error when user types
                    }}
                    placeholder="email@uchicago.edu"
                    className={`w-full pl-10 pr-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitEmail}
                  disabled={isLoading || !email}
                  className={`bg-orange-600 text-white px-4 py-2 rounded-md transition-colors font-medium ${isLoading || !email ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-700'}`}
                >
                  {isLoading ? 'Sending...' : 'Send Code'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-gray-600 mb-3">
                  Enter the 6-digit code we sent to <span className="font-medium">{email}</span>
                </p>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    maxLength={6}
                    disabled={isLoading}
                  />
                </div>
                <div className="mt-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setStage('email')}
                    className="text-orange-600 hover:text-orange-700"
                    disabled={isLoading}
                  >
                    Change email
                  </button>
                  <span className="mx-2 text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className={`text-orange-600 hover:text-orange-700 ${resendTimer > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isResending || resendTimer > 0}
                  >
                    {isResending ? 'Resending...' : resendTimer > 0 ? `Resend code (${resendTimer}s)` : 'Resend code'}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleVerifyCode}
                  disabled={isLoading || !code}
                  className={`bg-orange-600 text-white px-4 py-2 rounded-md transition-colors font-medium ${isLoading || !code ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-700'}`}
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
