import { Snacks } from '../enums/ISnacks';

export interface IUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  snacks: Snacks[];
}
