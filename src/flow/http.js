/* @flow */
export type IncomingMessage = {
  headers: Object;
  httpVersion: string;
  method: string;
  trailers: Object;
  setTimeout: (msecs: number, callback: Function) => void;
  statusCode: number;
  url: string;
  query: Object;
  href: string;
  pathname: string;
  search: string;
  body: Object;
}

export type ServerResponse = {
  writeHead: (code: number, headers: Object) => void;
  write: (data: string) => void;
  end: () => void;
}

export type Server = {
  listen: (port: number, hostname?: string, backlog?: number, callback?: Function) => Server;
  listen: (path: string, callback?: Function) => Server;
  listen: (handle: Object, callback?: Function) => Server;
}
