import { Logger } from '@aws-lambda-powertools/logger';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { HttpStatusCode } from 'axios';

import { version } from '@/../package.json';
import { PathsEnum } from './common/enum/paths.enum';
import exampleHandler from './functions/example.handler';

const logger = new Logger({ serviceName: 'reports-uploader/handler' });

export const handler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const body = _event.body ? JSON.parse(_event.body) : {};

  const path = _event.path.split('/').pop() as PathsEnum;

  return processRequest(body, path);
};

const processRequest = async (payload: Record<string, unknown>, path: PathsEnum): Promise<APIGatewayProxyResult> => {
  try {
    switch (path) {
      case PathsEnum.example: {
        const result = await exampleHandler(payload);
        const status = result.ok ? HttpStatusCode.Ok : result.error.status;

        const res = {
          statusCode: status,
          body: JSON.stringify({
            statusCode: status,
            detail: result.ok ? result.result : result.error,
          }),
        };

        return result.ok ? Promise.resolve(res) : Promise.reject(res);
      }

      default: {
        return Promise.reject({
          statusCode: 404,
          body: JSON.stringify({
            message: `Could not find path ${path} as of version - ${version}`,
            statusCode: 404,
            statusText: 'Not Found',
          }),
        });
      }
    }
  } catch (e) {
    logger.error(e);
  }
};
