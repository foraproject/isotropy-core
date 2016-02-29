/* @flow */
export interface IncomingMessage {
  headers: Object;
  httpVersion: string;
  method: string;
  trailers: Object;
  setTimeout(msecs: number, callback: Function) : void;
  statusCode: number;
  url: string;
  query: Object;
  href: string;
  pathname: string;
  search: string;
  body: Object;
}

export interface ServerResponse {
  writeHead(code: number, headers: Object) : void;
  write(data: string) : void;
  end() : void;
}

export interface Server {
  listen(port: number, hostname?: string, backlog?: number, callback?: Function): Server;
}
