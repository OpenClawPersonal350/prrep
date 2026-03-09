import apiClient from './apiClient';

class ApiService {
  // Auth endpoints
  async register(name: string, email: string, password: string) {
    try {
      const response = await apiClient.post('/auth/register', { name, email, password });
      const data = response.data;
      if (data.success && data.data) {
        return {
          success: true,
          message: data.message,
          token: data.data.token,
          user: data.data.user
        };
      }
      return data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const data = response.data;
      if (data.success && data.data) {
        return {
          success: true,
          message: data.message,
          token: data.data.token,
          user: data.data.user
        };
      }
      return data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  }

  // Profile endpoints
  async getProfile() {
    try {
      const response = await apiClient.get('/profile/profile');
      const data = response.data;

      // Sync backend source of truth directly into global local storage for the Layout providers
      if (data.success) {
        const userStr = localStorage.getItem('replycraft_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          let updated = false;

          if (data.name !== undefined && user.name !== data.name) {
            user.name = data.name;
            updated = true;
          }
          if (data.avatarUrl !== undefined && user.avatarUrl !== data.avatarUrl) {
            user.avatarUrl = data.avatarUrl;
            updated = true;
          }

          if (updated) {
            localStorage.setItem('replycraft_user', JSON.stringify(user));
            window.dispatchEvent(new Event('user_profile_updated'));
          }
        }
      }

      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  }

  async updateProfile(data: any) {
    try {
      const response = await apiClient.post('/profile/profile', data);
      
      // Persist name to local storage user object since backend does not natively track these specific extra fields
      const userStr = localStorage.getItem('replycraft_user');
      if (userStr && (data.name !== undefined)) {
        const user = JSON.parse(userStr);
        if (data.name !== undefined) user.name = data.name;
        localStorage.setItem('replycraft_user', JSON.stringify(user));
        
        // Dispatch custom event to let React context know of direct localstorage changes
        window.dispatchEvent(new Event('user_profile_updated'));
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  async uploadAvatar(file: Blob) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.post('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update the token in local storage
      const userStr = localStorage.getItem('replycraft_user');
      if (userStr && response.data.avatarUrl) {
        const user = JSON.parse(userStr);
        user.avatarUrl = response.data.avatarUrl;
        localStorage.setItem('replycraft_user', JSON.stringify(user));
        
        window.dispatchEvent(new Event('user_profile_updated'));
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to upload avatar');
    }
  }

  // Review endpoints
  async getReviews(params?: {
    platform?: string;
    status?: string;
    sentiment?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      const response = await apiClient.get('/reviews', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }

  async getReview(id: string) {
    try {
      const response = await apiClient.get(`/reviews/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch review');
    }
  }

  async generateReviewReply(reviewId: string) {
    try {
      const response = await apiClient.post(`/reviews/${reviewId}/generate`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate reply');
    }
  }

  async approveReview(reviewId: string) {
    try {
      const response = await apiClient.post(`/reviews/${reviewId}/approve`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to approve review');
    }
  }

  async updateReviewReply(reviewId: string, replyText: string) {
    try {
      const response = await apiClient.put(`/reviews/${reviewId}/edit`, { replyText });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update reply');
    }
  }

  async sendReviewReply(reviewId: string) {
    try {
      const response = await apiClient.post(`/reviews/${reviewId}/send`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send reply');
    }
  }

  async rejectReview(reviewId: string) {
    try {
      const response = await apiClient.post(`/reviews/${reviewId}/reject`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reject review');
    }
  }

  // Reply endpoints
  async generateReply(reviewText: string, tone: string = 'professional') {
    try {
      const response = await apiClient.post('/reply/generate-reply', { reviewText, tone });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate reply');
    }
  }

  // Analytics endpoints
  async getAnalyticsOverview() {
    try {
      const response = await apiClient.get('/analytics/overview');
      return response.data.overview || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to fetch analytics overview');
    }
  }

  async getAnalyticsReviews(params?: any) {
    try {
      const response = await apiClient.get('/analytics/reviews', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch analytics reviews');
    }
  }

  async getAnalyticsSentiment(params?: any) {
    try {
      const response = await apiClient.get('/analytics/sentiment', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch analytics sentiment');
    }
  }

  async getAnalyticsPerformance(params?: any) {
    try {
      const response = await apiClient.get('/analytics/performance', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch analytics performance');
    }
  }

  // Google integration
  async connectGoogle() {
    try {
      const response = await apiClient.get('/google/connect');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to connect Google');
    }
  }



  async getGoogleConnections() {
    try {
      const response = await apiClient.get('/google/connections');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch connections');
    }
  }

  async disconnectGoogle(id: string) {
    try {
      const response = await apiClient.delete(`/google/connections/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to disconnect');
    }
  }

  // Integrations
  async getIntegrations() {
    try {
      const response = await apiClient.get('/integrations');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch integrations');
    }
  }

  async connectGoogle(code: string, redirectUri?: string) {
    try {
      const response = await apiClient.post('/integrations/google/connect', {
        code,
        redirectUri
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to connect Google');
    }
  }

  async disconnectIntegration(id: string) {
    try {
      const response = await apiClient.delete(`/integrations/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to disconnect');
    }
  }

  // Billing / Subscription
  async getSubscription() {
    try {
      const response = await apiClient.get('/billing/subscription');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch subscription');
    }
  }

  async createCheckoutSession(plan: string) {
    try {
      const response = await apiClient.post('/billing/create-order', { plan });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create payment order');
    }
  }

  async verifyPayment(razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string, plan: string) {
    try {
      const response = await apiClient.post('/billing/verify-payment', {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        plan
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
  }

  async cancelSubscription() {
    try {
      const response = await apiClient.post('/billing/cancel');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel subscription');
    }
  }

  // AI Configuration methods
  async getAIConfigurations() {
    try {
      const response = await apiClient.get('/ai-config');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch configurations');
    }
  }

  async createAIConfiguration(config: {
    configName: string;
    businessName?: string;
    brandTone?: string;
    emojiAllowed?: boolean;
    replyMode?: string;
    replyDelayMinutes?: number;
    isDefault?: boolean;
  }) {
    try {
      const response = await apiClient.post('/ai-config', config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create configuration');
    }
  }

  async updateAIConfiguration(id: string, config: {
    configName?: string;
    businessName?: string;
    brandTone?: string;
    emojiAllowed?: boolean;
    replyMode?: string;
    replyDelayMinutes?: number;
    isDefault?: boolean;
  }) {
    try {
      const response = await apiClient.put(`/ai-config/${id}`, config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update configuration');
    }
  }

  async deleteAIConfiguration(id: string) {
    try {
      const response = await apiClient.delete(`/ai-config/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete configuration');
    }
  }

  // Insights endpoints
  async getInsights() {
    try {
      const response = await apiClient.get('/insights');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch insights');
    }
  }

  async getInsightsHistory(limit?: number) {
    try {
      const response = await apiClient.get('/insights/history', { params: { limit } });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch insights history');
    }
  }

  async generateInsights() {
    try {
      const response = await apiClient.post('/insights/generate');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate insights');
    }
  }

  async setDefaultAIConfiguration(id: string) {
    try {
      const response = await apiClient.post(`/ai-config/${id}/set-default`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to set default configuration');
    }
  }

  // User helpers
  getAuthToken(): string | null {
    return localStorage.getItem('replycraft_token');
  }

  getUser() {
    const userStr = localStorage.getItem('replycraft_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  logout() {
    localStorage.removeItem('replycraft_token');
    localStorage.removeItem('replycraft_user');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const apiService = new ApiService();
export default apiService;

export const getUser = () => apiService.getUser();
export const getProfile = () => apiService.getProfile();
export const updateProfile = (data: any) => apiService.updateProfile(data);
export const getPendingReviews = (params?: any) => apiService.getPendingReviews(params);
export const getAnalyticsReviews = (params?: any) => apiService.getAnalyticsReviews(params);
export const getAnalyticsSentiment = (params?: any) => apiService.getAnalyticsSentiment(params);
export const getAnalyticsPerformance = (params?: any) => apiService.getAnalyticsPerformance(params);
export const approveReview = (reviewId: string) => apiService.approveReview(reviewId);
export const rejectReview = (reviewId: string) => apiService.rejectReview(reviewId);
export const getAnalyticsOverview = () => apiService.getAnalyticsOverview();
export const generateReply = (reviewText: string, tone?: string) => apiService.generateReply(reviewText, tone);
export const getGoogleConnections = () => apiService.getGoogleConnections();
export const connectGoogle = () => apiService.connectGoogle();
export const disconnectGoogle = (id: string) => apiService.disconnectGoogle(id);
export const getInsights = () => apiService.getInsights();
export const getInsightsHistory = (limit?: number) => apiService.getInsightsHistory(limit);
export const generateInsights = () => apiService.generateInsights();

// Types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  plan: string;
  dailyUsage?: number;
}

export interface Review {
  _id: string;
  id?: string;
  customerName: string;
  platform: string;
  rating: number;
  reviewText: string;
  aiReply?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

export interface Profile {
  restaurantName?: string;
  brandTone?: string;
  emojiAllowed?: boolean;
  cuisineType?: string;
  replyMode?: string;
  replyDelayMinutes?: number;
}

export interface AnalyticsOverview {
  totalReviews: number;
  totalReplies?: number;
  aiRepliesSent: number;
  averageRating: number;
  pendingApprovals: number;
  reviewsOverTime?: {name: string, reviews: number, replies: number}[];
  sentimentBreakdown?: {positive: number, neutral: number, negative: number};
}

export interface Insight {
  _id: string;
  userId: string;
  topComplaints: { keyword: string; count: number; examples: string[] }[];
  topPraises: { keyword: string; count: number; examples: string[] }[];
  commonKeywords: { keyword: string; count: number }[];
  reviewCount: number;
  averageRating: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  platformBreakdown: Record<string, number>;
  summary: string | null;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
}

