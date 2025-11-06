import { Request, Response, NextFunction } from 'express';

export const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  const userId = Number(req.params.id);
  
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({
      error: 'Invalid user ID'
    });
  }
  
  next();
};

export const validateAdminAction = (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      error: 'Admin password is required for this action'
    });
  }
  
  next();
};