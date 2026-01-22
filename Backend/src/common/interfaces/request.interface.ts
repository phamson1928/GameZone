import { Request } from 'express';

// User payload that will be attached to request after JWT validation
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Extended Express Request with user
export interface RequestWithUser extends Request {
  user?: JwtPayload;
}
