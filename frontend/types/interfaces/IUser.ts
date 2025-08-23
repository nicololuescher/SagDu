import { Snacks } from '../enums/ISnacks';

export default interface IUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  snacks: Record<Snacks, number>;
  duckHealth: number;
}
