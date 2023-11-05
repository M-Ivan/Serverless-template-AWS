import { HttpStatusCode } from 'axios';

export interface ErrorInterface {
  name: string;
  message: string;
  status: HttpStatusCode;
}
