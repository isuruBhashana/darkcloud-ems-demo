import { All, Controller, Req, Res } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { toNodeHandler } from 'better-auth/node';
import type { Request, Response } from 'express';
import { auth } from './auth';

@Controller('auth')
@AllowAnonymous()
export class AuthController {
  @All('*')
  handleAuth(@Req() req: Request, @Res() res: Response) {
    return toNodeHandler(auth)(req, res);
  }
}
