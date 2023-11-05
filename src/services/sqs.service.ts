import { Logger } from '@aws-lambda-powertools/logger';
import { AWSError, Credentials, SQS } from 'aws-sdk';

import { OperationInterface } from '@/common/interface/operation.interface';

export default class SQSService {
  private readonly logger: Logger;
  constructor() {
    this.logger = new Logger({ serviceName: `sqs-client` });
  }

  async publishMessage(
    queueUrl: string,
    payload: Record<string, unknown>,
  ): Promise<OperationInterface<SQS.SendMessageResult, AWSError>> {
    try {
      const config = this.configureClient(queueUrl);

      const sqs = new SQS(config);

      const params: SQS.SendMessageRequest = {
        MessageBody: JSON.stringify(payload),
        QueueUrl: queueUrl,
      };

      const response = await sqs.sendMessage(params).promise();
      return { ok: true, result: response };
    } catch (e) {
      this.logger.error(e);

      return { ok: false, error: e };
    }
  }

  /**
   * @method configureSqsClient
   * Configures the SQS client with the necessary credentials and region
   * @param {string} queueUrl the url of the queue to configure the client for
   * @returns {SQS.ClientConfiguration} the SQS client configuration
   * */
  private configureClient(queueUrl: string): SQS.ClientConfiguration {
    let credentials: Credentials;

    // Set authentication only if there are given credentials
    // (local dev only)
    if (process.env.AWS_ACCESS_KEY && process.env.AWS_SECRET_KEY) {
      credentials = new Credentials({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
      });
    }

    const sqsConfig: SQS.ClientConfiguration = {
      endpoint: queueUrl,
      // Only attach credentials if they are defined
      ...(credentials && { credentials }),
      region: process.env.AWS_REGION,
    };

    return sqsConfig;
  }
}
