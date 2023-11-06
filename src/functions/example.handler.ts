import { OperationInterface } from '@/common/interface/operation.interface';

export default async (body: Record<string, unknown>): Promise<OperationInterface<any>> => {
  return {
    ok: true,
    result: {},
  };
};
