/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
    status: number;
    
    constructor(message: string, status: number) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }
  
  /**
   * Helper function to handle API responses and catch errors
   */
  export async function handleApiResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use text instead
        try {
          errorMessage = await response.text();
        } catch (e2) {
          // Keep default error message if text extraction fails
        }
      }
      
      throw new ApiError(errorMessage, response.status);
    }
    
    return response.json() as Promise<T>;
  }
  
  /**
   * Generic API fetcher with error handling
   */
  export async function apiFetch<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });
      
      return handleApiResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error',
        500
      );
    }
  }
  
  // API Types
  
  export interface ZkLoginNonceResponse {
    nonce: string;
    timestamp: number;
  }
  
  export interface UserIdentityResponse {
    address: string;
    name: string;
    provider: string;
    active: boolean;
    created_at: number;
    updated_at: number;
  }
  
  export interface PermissionResponse {
    id: string;
    app_id: string;
    app_name: string;
    scopes: string[];
    expiration?: number;
    granted_at: number;
    app_url?: string;
    app_icon_url?: string;
  }
  
  export interface CredentialResponse {
    id: string;
    credential_type: string;
    issuer: string;
    issuer_name: string;
    issued_at: number;
    expiration?: number;
    metadata?: string;
    revoked: boolean;
  }
  
  // API Endpoints (placeholders - in a real app these would call your backend)
  
  /**
   * Requests a zkLogin nonce from the server
   */
  export async function requestZkLoginNonce(
    provider: string,
    username: string
  ): Promise<ZkLoginNonceResponse> {
    // In a real implementation, this would be a backend call
    // For demo purposes, we'll simulate a response
    return {
      nonce: Math.random().toString(36).substring(2, 15),
      timestamp: Date.now(),
    };
  }
  
  /**
   * Gets user identity information
   */
  export async function getUserIdentity(
    address: string
  ): Promise<UserIdentityResponse | null> {
    // In a real implementation, this would be a backend call
    // For demo purposes, we'll simulate a response
    return {
      address,
      name: 'Demo User',
      provider: 'google',
      active: true,
      created_at: Date.now() - 86400000, // 1 day ago
      updated_at: Date.now(),
    };
  }
  
  /**
   * Gets user permissions
   */
  export async function getUserPermissions(
    address: string
  ): Promise<PermissionResponse[]> {
    // In a real implementation, this would be a backend call
    // For demo purposes, we'll simulate a response
    return [
      {
        id: '0x1234567890',
        app_id: 'app-1',
        app_name: 'Example dApp',
        scopes: ['profile:read', 'transactions:write'],
        granted_at: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
        app_url: 'https://example.com',
        app_icon_url: 'https://via.placeholder.com/50',
      },
      {
        id: '0x0987654321',
        app_id: 'app-2',
        app_name: 'Demo Application',
        scopes: ['profile:read'],
        expiration: Date.now() + 1000 * 60 * 60 * 24 * 30, // Expires in 30 days
        granted_at: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        app_url: 'https://demo.example.com',
      },
    ];
  }
  
  /**
   * Gets user credentials
   */
  export async function getUserCredentials(
    address: string
  ): Promise<CredentialResponse[]> {
    // In a real implementation, this would be a backend call
    // For demo purposes, we'll simulate a response
    return [
      {
        id: '0x1234',
        credential_type: 'KYC_VERIFICATION',
        issuer: '0x5678',
        issuer_name: 'Verisure Identity',
        issued_at: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
        expiration: Date.now() + 1000 * 60 * 60 * 24 * 365, // expires in 1 year
        metadata: 'Level 2',
        revoked: false,
      },
      {
        id: '0x5678',
        credential_type: 'EMAIL_VERIFICATION',
        issuer: '0x9abc',
        issuer_name: 'SuiAuth',
        issued_at: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
        revoked: false,
      },
    ];
  }
  
  /**
   * Revokes a permission
   */
  export async function revokePermission(
    address: string,
    permissionId: string
  ): Promise<boolean> {
    // In a real implementation, this would be a backend call
    // For demo purposes, we'll simulate a response
    return true;
  }
  
  /**
   * Deletes a credential
   */
  export async function deleteCredential(
    address: string,
    credentialId: string
  ): Promise<boolean> {
    // In a real implementation, this would be a backend call
    // For demo purposes, we'll simulate a response
    return true;
  }
