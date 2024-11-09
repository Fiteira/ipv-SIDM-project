import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { Request, Response, NextFunction } from 'express';

export const jwtAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
  
      if (err) {
        console.error("Error in Passport authentication:", err);
        return next(err);
      }
  
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'You must be logged in to access this resource. Token is invalid.' 
        });
      }
  
      (req as any).user = user;
      return next();
    })(req, res, next);
  };

// Rate limiting for general access (5 requests per 5 seconds)
export const limitAccess = rateLimit({
    windowMs: 5000, // 5 seconds
    max: 5,
    message: { 
        success: false, 
        message: "Too many requests from this user, please try again after 15 minutes." 
    }
});

// Rate limiting for login attempts (5 login attempts per minute)
export const limitLogin = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: { 
        success: false, 
        message: "Too many login attempts from this user, please try again after 1 minute." 
    },
    keyGenerator: (req: Request): string => {
        return req.body.email;  // Use the email field from the request body as the rate limit key
    }
});
