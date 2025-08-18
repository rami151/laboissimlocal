import { getAccessToken } from './utils';

export interface UserProfile {
  phone?: string;
  bio?: string;
  profile_image?: string;
  location?: string;
  institution?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
}

export interface ExtendedUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  profile: UserProfile;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const getCurrentUser = async (): Promise<ExtendedUser> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/user/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user data: ${response.statusText}`);
  }

  return response.json();
};

export const getUserProfile = async (): Promise<UserProfile> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/user/profile/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile data: ${response.statusText}`);
  }

  return response.json();
};

export const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/user/profile/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to update profile: ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  return response.json();
};

export const uploadProfileImage = async (file: File): Promise<{ profile_image: string }> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const formData = new FormData();
  formData.append('profile_image', file);

  const response = await fetch(`${API_BASE_URL}/user/profile/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to upload profile image: ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  return response.json();
};
