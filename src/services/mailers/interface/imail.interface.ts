export interface Imail {
  email: string;
  body: string;
  subject?: string;
  user?: any;
  template?: string;

  setBody(): any;
}
