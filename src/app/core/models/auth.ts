export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
}

export interface AuthUserProfile {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  emailVerified: number | boolean;
  phoneVerified: number | boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface LoginResponse {
  success: true;
  message: string;
  data: LoginResponseData;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  success: true;
  message: string;
  data: AuthUser;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  success: true;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface MeResponse {
  success: true;
  message: string;
  data: AuthUserProfile;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  success: true;
  message: string;
}
