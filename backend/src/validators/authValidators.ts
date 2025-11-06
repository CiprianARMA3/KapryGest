import { Request, Response, NextFunction } from 'express';

export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { username, email, password, birthdate, name, surname, phone_number } = req.body;
  
  if (!username || !email || !password || !birthdate || !name || !surname || !phone_number) {
    return res.status(400).json({
      error: 'All fields are required: username, email, password, birthdate, name, surname, phone_number'
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters long'
    });
  }
  
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({
      error: 'Invalid email format'
    });
  }
  
  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required'
    });
  }
  
  next();
};