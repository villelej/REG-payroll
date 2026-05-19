import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        (exceptionResponse as any).message ||
        exception.message ||
        'Internal server error',
      error: (exceptionResponse as any).error || 'Error',
    });
    try {
      const logPath = path.join(process.cwd(), 'error.log');
      const entry = `[${new Date().toISOString()}] HTTP ${status} ${request.method} ${request.url} - ${(exceptionResponse as any).message || exception.message}\n${JSON.stringify(exceptionResponse)}\n\n`;
      fs.appendFileSync(logPath, entry, { encoding: 'utf8' });
    } catch (e) {}
  }
}
