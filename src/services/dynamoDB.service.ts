import { OperationInterface } from '@/common/interface/operation.interface';
import { AttributeValue, DynamoDB, DynamoDBClientConfig, PutItemCommandOutput } from '@aws-sdk/client-dynamodb';

export class DynamoDBClient {
  async put<T>(tableName: string, item: T[]): Promise<OperationInterface<PutItemCommandOutput>> {
    try {
      const DDBClient = new DynamoDB(this.configureClient());

      const params = {
        TableName: tableName,
        Item: item as unknown as Record<string, AttributeValue>,
      };

      const result = await DDBClient.putItem(params);

      return { ok: true, result };
    } catch (e) {
      console.error(`AWS/DynamoDB/put`, e);
      throw e;
    }
  }

  async getItem<T>(tableName: string, pk: { property: keyof T; value: unknown }): Promise<OperationInterface<T>> {
    try {
      const DDBClient = new DynamoDB(this.configureClient());

      const params = {
        TableName: tableName,
        Key: {
          [pk.property]: { S: pk.value as string },
        },
      };
      const result = await DDBClient.getItem(params);
      return { ok: true, result: result.Item as T };
    } catch (e) {}
  }

  async query<T>(tableName: string, params: { property: keyof T; value: unknown }[]): Promise<T[]> {
    const keyConditionExpression = [];
    const expressionAttributeValues = {};

    const DDBClient = new DynamoDB(this.configureClient());

    for (let i = 0; i < params.length; i++) {
      const param = params[i];

      const key = `#property${i}`;
      const value = `:value${i}`;
      keyConditionExpression.push(`${key} = ${value}`);
      expressionAttributeValues[key] = param.property;
      expressionAttributeValues[value] = param.value;
    }

    const requestParams = {
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression.join(' AND '),
      ExpressionAttributeNames: { '#property0': params[0].property.toString() }, // Use the first property as an example
      ExpressionAttributeValues: expressionAttributeValues,
    };

    try {
      const result = await DDBClient.query(requestParams);
      return result.Items as T[];
    } catch (e) {
      console.error(`AWS/DynamoDB/query`, e);
      throw e;
    }
  }

  private configureClient(): DynamoDBClientConfig {
    let credentials;

    // Set authentication only if there are given credentials
    // (local dev only)
    if (process.env.AWS_ACCESS_KEY && process.env.AWS_SECRET_KEY) {
      credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
      };
    }

    const DDBConfig: DynamoDBClientConfig = {
      endpoint: `https://dynamodb.${process.env.AWS_REGION}.amazonaws.com`,
      // Only attach credentials if they are defined
      ...(credentials && { credentials }),
      region: process.env.AWS_REGION,
    };

    return DDBConfig;
  }
}
