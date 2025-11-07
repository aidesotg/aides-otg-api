export interface SocialAuthToken {
  readonly id: string;
  user: string;
  social: 'google' | 'apple';
  access_token: string;
  refresh_token: string;
  is_active: boolean;
  is_deleted: boolean;
  deleted: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
