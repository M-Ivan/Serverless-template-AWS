import { Logger } from '@aws-lambda-powertools/logger';
import { PutObjectCommandInput, PutObjectOutput, S3, S3ClientConfig } from '@aws-sdk/client-s3';
import { OperationInterface } from '@/common/interface/operation.interface';
import { getAwsCredentials } from '@/common/helpers/aws.helpers';

export default class S3Service {
  private readonly logger: Logger;
  constructor() {
    this.logger = new Logger({ serviceName: `s3-client` });
  }

  async putObject(bucket: string, objectKey: string, data: Buffer): Promise<OperationInterface<PutObjectOutput>> {
    try {
      const config = this.configureClient();

      const s3 = new S3(config);

      const fileName = objectKey.split('/').pop();

      const params: PutObjectCommandInput = {
        Bucket: bucket,
        Key: objectKey,
        Body: data,
        Tagging: `fileName=${fileName}`,
      };

      const response = await s3.putObject(params);

      return { ok: true, result: response };
    } catch (e) {
      this.logger.error(e);
      return { ok: false, error: e };
    }
  }

  private configureClient(): S3ClientConfig {
    const credentials = getAwsCredentials();

    const s3Config: S3ClientConfig = {
      endpoint: `https://s3.${process.env.AWS_REGION}.amazonaws.com`,
      // Only attach credentials if they are defined
      ...(credentials && { credentials }),
      region: process.env.AWS_REGION,
    };

    return s3Config;
  }
}
