import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      // Preserve HttpException message for client (validation, auth, etc.)
      message = (res as any).message || exception.message || message;
      // Log details for HttpException as well
      if (exception instanceof Error) {
        this.logger.warn(exception.message, exception.stack);
        try {
          const logPath = path.join(process.cwd(), 'error.log');
          const entry = `[${new Date().toISOString()}] HTTP ${status} ${request?.method ?? 'N/A'} ${request?.url ?? 'N/A'} - ${exception.message}\n${exception.stack}\n\n`;
          fs.appendFileSync(logPath, entry, { encoding: 'utf8' });
        } catch (e) {}
      }
    } else {
      // Log the full non-Http error server-side for diagnostics but do NOT expose details to the client
      if (exception instanceof Error) {
        this.logger.error(exception.message, exception.stack);
        try {
          const logPath = path.join(process.cwd(), 'error.log');
          const entry = `[${new Date().toISOString()}] ${request?.method ?? 'N/A'} ${request?.url ?? 'N/A'} - ${exception.message}\n${exception.stack}\n\n`;
          fs.appendFileSync(logPath, entry, { encoding: 'utf8' });
        } catch (e) {
          // swallow file logging errors
        }
      } else {
        this.logger.error(
          'Unknown exception thrown',
          JSON.stringify(exception),
        );
        try {
          const logPath = path.join(process.cwd(), 'error.log');
          const entry = `[${new Date().toISOString()}] Unknown exception: ${JSON.stringify(exception)}\n\n`;
          fs.appendFileSync(logPath, entry, { encoding: 'utf8' });
        } catch (e) {}
      }
      // keep client-facing message generic
      message = 'Internal server error';
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
