import { UserData } from '../entities/admin-side/UserData';

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string } & Partial<UserData>;
    }
  }
}
