import { Request, Response, NextFunction } from 'express';

export const validateSubordinateWorker = (req: Request, res: Response, next: NextFunction) => {
  const { name, surname, email, phone_number, role, password } = req.body;
  
  if (!name || !surname || !email || !phone_number || !role || !password) {
    return res.status(400).json({
      error: 'All fields are required: name, surname, email, phone_number, role, password'
    });
  }
  
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({
      error: 'Invalid email format'
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters long'
    });
  }
  
  next();
};