import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { Request, Response, NextFunction } from 'express';

// JWT Authentication Middleware using Passport
export const jwtAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    console.log("jwtAuthMiddleware entry");

    passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
        console.log("Passport authenticate callback");
        if (err) {
            console.error("Error in Passport authentication:", err);
            return next(err);
        }
        if (!user) {
            console.log("User not found:", info);
            return res.status(401).json({ 
                success: false, 
                message: 'You must be logged in to access this resource. Token is invalid.' 
            });
        }
        // Attach the authenticated user to the request object
        (req as any).user = user;  // Use type assertion because Express does not define user on req
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
