import { OperationInterface } from '@/common/interface/operation.interface';
import { HttpStatusCode } from 'axios';

export default async (body: Record<string, unknown>): Promise<OperationInterface<any>> => {
  try {
    return {
      ok: true,
      result: {},
    };
  } catch (e) {
    return {
      ok: false,
      error: {
        status: HttpStatusCode.InternalServerError,
        message: e.message,
        code: 'example_error',
      },
    };
  }
};
