import { Request, Response } from 'express';
import { MikroORM } from '@mikro-orm/postgresql';
import { getORM } from '../config/database';
import { AuthService } from '../services/authService';
import { UserService } from '../services/userService';
import { FileService } from '../services/fileService';
import usersConfig from '../config/users-orm.config';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const orm = getORM();
      const em = orm.em.fork();
      const { username, email, password, birthdate, name, surname, phone_number } = req.body;

      const existing = await em.findOne('UserData', { email });
      if (existing) return res.status(400).json({ error: 'Email already registered' });

      const hashedPassword = await AuthService.hashPassword(password);

      const newUser = em.create('UserData', {
        username,
        email,
        password: hashedPassword,
        birthdate: new Date(birthdate),
        expired: false,
        suspended: false,
        name,
        surname,
        phone_number,
        admin: false,
      });

      await em.persistAndFlush(newUser);

      // Create tenant tables and folders
      const usersOrm = await MikroORM.init(usersConfig);
      await UserService.createUserTenantTables((newUser as any).id);
      await FileService.ensureUserFolderStructure((newUser as any).id);

      // Create JWT token
      const token = AuthService.generateToken({ 
        id: (newUser as any).id, 
        email: (newUser as any).email 
      });
      
      // Set cookie directly instead of using service method
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: { 
          id: (newUser as any).id, 
          email: (newUser as any).email, 
          username: (newUser as any).username 
        },
        token,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create user, tenant tables, or folders' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const orm = getORM();
      const em = orm.em.fork();
      const { email, password } = req.body;

      const user = await em.findOne('UserData', { email }) as any;
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (user.suspended) return res.status(403).json({ error: 'Account suspended. Please contact administrator.' });

      const isMatch = await AuthService.comparePassword(password, user.password);
      if (!isMatch) return res.status(401).json({ error: 'Incorrect password' });

      // Ensure folder structure exists on login
      try {
        await FileService.ensureUserFolderStructure(user.id);
      } catch (folderErr) {
        console.error('Warning: Could not ensure folder structure on login:', folderErr);
      }

      const token = AuthService.generateToken({ id: user.id, email: user.email });
      
      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      });

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          surname: user.surname,
          username: user.username,
          phone_number: user.phone_number,
          admin: user.admin,
          suspended: user.suspended,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error during login' });
    }
  }

  static async getCurrentUser(req: Request, res: Response) {
    try {
      const orm = getORM();
      const em = orm.em.fork();
      const user = await em.findOne('UserData', { id: (req as any).user?.id }) as any;
      if (!user) return res.status(401).json({ error: 'User not found' });

      res.json({
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        username: user.username,
        phone_number: user.phone_number,
        admin: user.admin,
        suspended: user.suspended,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error fetching user' });
    }
  }
}