import { HttpStatusCode } from 'axios';

export interface ErrorInterface {
  code: string;
  message: string;
  status: HttpStatusCode;
}
