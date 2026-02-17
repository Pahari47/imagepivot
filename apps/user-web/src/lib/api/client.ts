const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'An error occurred',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  }

  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  }

  // Auth endpoints
  async register(data: { email: string; password: string; name?: string }) {
    return this.request<{ data: { user: any; token: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{ data: { user: any; token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser() {
    return this.request<{ data: { user: any } }>('/auth/me', {
      method: 'GET',
    });
  }

  async verifyEmail(token: string) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerification() {
    return this.request('/auth/resend-verification', {
      method: 'POST',
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // Org endpoints
  async getMyOrg() {
    return this.request<{ data: { org: any; role: string } }>('/orgs/me', {
      method: 'GET',
    });
  }

  async getOrgDetails(orgId: string) {
    return this.request<{ data: { org: any; role: string } }>(`/orgs/${orgId}`, {
      method: 'GET',
    });
  }

  // Upload endpoints
  async getQuotaInfo() {
    return this.request<{ data: { limit: number; used: number; remaining: number; resetAt: string } }>('/upload/quota', {
      method: 'GET',
    });
  }

  async generatePresignedUrl(data: {
    orgId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    mediaType: 'image' | 'audio' | 'video';
  }) {
    return this.request<{ data: { uploadUrl: string; key: string; expiresIn: number } }>('/upload/presign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Features endpoints
  async getFeatures(mediaType?: 'IMAGE' | 'AUDIO' | 'VIDEO') {
    const query = mediaType ? `?mediaType=${mediaType}` : '';
    return this.request<{ data: Array<{
      id: string;
      slug: string;
      title: string;
      mediaType: string;
      isEnabled: boolean;
      configSchema: any;
    }> }>(`/features${query}`, {
      method: 'GET',
    });
  }

  async getFeatureBySlug(slug: string) {
    return this.request<{ data: {
      id: string;
      slug: string;
      title: string;
      mediaType: string;
      isEnabled: boolean;
      configSchema: any;
    } }>(`/features/${slug}`, {
      method: 'GET',
    });
  }

  // Jobs endpoints
  async createJob(data: {
    orgId: string;
    featureSlug: string;
    mediaType?: 'IMAGE' | 'AUDIO' | 'VIDEO';
    input: {
      key: string;
      sizeBytes: number;
      mimeType: string;
    };
    params?: Record<string, unknown>;
  }) {
    return this.request<{ data: {
      id: string;
      status: string;
      featureId: string;
      params: any;
      inputSizeMb: number;
      createdAt: string;
      files: Array<{
        id: string;
        kind: string;
        key: string;
        mimeType: string;
        sizeMb: number;
      }>;
    } }>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getJob(jobId: string) {
    return this.request<{ data: {
      id: string;
      status: string;
      params: any;
      inputSizeMb: number;
      error?: string;
      createdAt: string;
      completedAt?: string;
      files: Array<{
        id: string;
        kind: string;
        key: string;
        mimeType: string;
        sizeMb: number;
      }>;
      feature: {
        slug: string;
        title: string;
        mediaType: string;
      };
    } }>(`/jobs/${jobId}`, {
      method: 'GET',
    });
  }

  async getJobDownloadUrl(jobId: string) {
    return this.request<{ data: { downloadUrl: string; expiresIn: number } }>(`/jobs/${jobId}/download`, {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

