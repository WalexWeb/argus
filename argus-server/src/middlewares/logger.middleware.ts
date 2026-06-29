import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

export function logger(
  req: Request,
  res: Response,
  next: (error?: NextFunction) => void,
) {
  const logger = new Logger('HTTP');

  logger.log(`Request... ${req.method} ${req.url}`);
  next();
}
