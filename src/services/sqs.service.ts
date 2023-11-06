import { Logger } from '@aws-lambda-powertools/logger';

import { OperationInterface } from '@/common/interface/operation.interface';
import { SQS, SQSClientConfig, SendMessageCommandInput, SendMessageResult } from '@aws-sdk/client-sqs';
import { getAwsCredentials } from '@/common/helpers/aws.helpers';

export default class SQSService {
  private readonly logger: Logger;
  constructor() {
    this.logger = new Logger({ serviceName: `sqs-client` });
  }

  async publishMessage(
    queueUrl: string,
    payload: Record<string, unknown>,
  ): Promise<OperationInterface<SendMessageResult>> {
    try {
      const config = this.configureClient(queueUrl);

      const sqs = new SQS(config);

      const params: SendMessageCommandInput = {
        MessageBody: JSON.stringify(payload),
        QueueUrl: queueUrl,
      };

      const response = await sqs.sendMessage(params);
      return { ok: true, result: response };
    } catch (e) {
      this.logger.error(e);

      return { ok: false, error: e };
    }
  }

  private configureClient(queueUrl: string): SQSClientConfig {
    const credentials = getAwsCredentials();

    const sqsConfig: SQSClientConfig = {
      endpoint: queueUrl,
      ...(credentials && { credentials }),
      region: process.env.AWS_REGION,
    };

    return sqsConfig;
  }
}
