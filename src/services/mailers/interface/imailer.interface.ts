import { Imail } from './imail.interface';
export interface IMailers {
  send(mailclass: Imail): void;
}
