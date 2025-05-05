export interface VerificationRequest {
  id: string;
  userId: string;
  groupId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  verification?: VerificationRequest;
}

export interface VerificationListResponse {
  success: boolean;
  verifications: VerificationRequest[];
}

export interface CreateVerificationRequest {
  userId: string;
  groupId: string;
}

export interface UpdateVerificationRequest {
  id: string;
  status: 'approved' | 'rejected';
} 
