import { Document } from 'mongoose';
import { User } from 'src/modules/user/interface/user.interface';

export interface Session extends Document {
  user: User | string;
  browser?: string;
  device?: string;
  location?: string;
  ip_address?: string;
  last_login?: Date;
  jwt_token?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
