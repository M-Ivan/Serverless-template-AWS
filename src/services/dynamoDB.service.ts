import { getAwsCredentials } from '@/common/helpers/aws.helpers';
import { OperationInterface } from '@/common/interface/operation.interface';
import { Logger } from '@aws-lambda-powertools/logger';
import { AttributeValue, DynamoDB, DynamoDBClientConfig, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

export interface ItemPrimaryKey<T> {
  primary: AttributeValueInterface<T>;
  sort?: AttributeValueInterface<T>;
}

export interface AttributeValueInterface<T> {
  attribute: keyof T;
  value: unknown;
}

export class DynamoDBService {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger({ serviceName: `DynamoDB-client` });
  }

  async insert<T>(tableName: string, item: T, pk: ItemPrimaryKey<T>): Promise<OperationInterface<T>> {
    try {
      const DDBClient = new DynamoDB(this.configureClient());

      const conditionExpression =
        `attribute_not_exists(${pk.primary.attribute.toString()})` +
        (pk.sort ? ` AND attribute_not_exists(${pk.sort.attribute.toString()})` : '');

      const params: PutItemCommandInput = {
        TableName: tableName,
        Item: this.mapToDynamoDB(item),
        ConditionExpression: conditionExpression,
      };

      await DDBClient.putItem(params);

      return { ok: true, result: item };
    } catch (e) {
      this.logger.error(e);
      return { ok: false, error: e };
    }
  }

  async update<T>(tableName: string, item: T, pk: ItemPrimaryKey<T>): Promise<OperationInterface<T>> {
    try {
      const DDBClient = new DynamoDB(this.configureClient());

      const conditionExpression =
        `attribute_exists(${pk.primary.attribute.toString()})` +
        (pk.sort ? ` AND attribute_exists(${pk.sort.attribute.toString()})` : '');

      const params: PutItemCommandInput = {
        TableName: tableName,
        Item: this.mapToDynamoDB(item),
        ConditionExpression: conditionExpression,
      };

      await DDBClient.putItem(params);

      return { ok: true, result: item };
    } catch (e) {
      this.logger.error(e);
      return { ok: false, error: e };
    }
  }

  async findOne<T>(tableName: string, pk: ItemPrimaryKey<T>): Promise<OperationInterface<T>> {
    try {
      const DDBClient = new DynamoDB(this.configureClient());

      const pkParam = this.mapToDynamoDB({
        [pk.primary.attribute]: pk.primary.value,
        ...(pk.sort && { [pk.sort.attribute]: pk.sort.value }),
      });

      const params = {
        TableName: tableName,
        Key: pkParam,
      };
      const result = await DDBClient.getItem(params);
      return { ok: true, result: this.mapFromDynamoDB(result.Item) };
    } catch (e) {
      this.logger.error(e);
      return { ok: false, error: e };
    }
  }

  async find<T>(tableName: string, params: ItemPrimaryKey<T>): Promise<OperationInterface<T[]>> {
    const DDBClient = new DynamoDB(this.configureClient());

    const conditionExpression =
      `${params.primary.attribute.toString()} = :primary` +
      (params.sort ? ` AND ${params.sort.attribute.toString()} = :sort` : '');

    const requestParams = {
      TableName: tableName,
      KeyConditionExpression: conditionExpression,
      ExpressionAttributeValues: this.createFilterExpression(params),
    };

    try {
      const response = await DDBClient.query(requestParams);

      const items: T[] = [];
      for (const item of response.Items) {
        items.push(this.mapFromDynamoDB(item));
      }

      return { ok: true, result: items };
    } catch (e) {
      this.logger.error(e);
      return { ok: false, error: e };
    }
  }

  private configureClient(): DynamoDBClientConfig {
    const credentials = getAwsCredentials();

    const DDBConfig: DynamoDBClientConfig = {
      endpoint: `https://dynamodb.${process.env.AWS_REGION}.amazonaws.com`,
      ...(credentials && { credentials }),
      region: process.env.AWS_REGION,
    };

    return DDBConfig;
  }

  private mapToDynamoDB<T>(item: T): Record<string, AttributeValue> {
    return marshall(item, { convertEmptyValues: true, removeUndefinedValues: true });
  }

  private mapFromDynamoDB<T>(item: Record<string, AttributeValue>): T {
    return unmarshall(item) as T;
  }

  private createFilterExpression<T>(itemPrimaryKey: ItemPrimaryKey<T>): Record<string, AttributeValue> {
    const object = {
      ':primary': itemPrimaryKey.primary.value,
      ...(itemPrimaryKey.sort && { ':sort': itemPrimaryKey.sort.value }),
    };

    return this.mapToDynamoDB(object);
  }
}
