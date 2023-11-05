import { ErrorInterface } from './error.interface';

export interface OperationInterface<T, K = ErrorInterface> {
  ok: boolean;
  result?: T;
  error?: K;
}
