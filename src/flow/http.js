/* @flow */
export class IncomingMessage {
  headers: Object;
  httpVersion: string;
  method: string;
  trailers: Object;
  setTimeout: (msecs: number, callback: Function) => void;
  statusCode: number;
  url: String;
}

export class ServerResponse {
  writeHead: (code: number, headers: Object) => void;
  write: (data: string) => void;
  end: () => void;
}

export class Server {
  listen: (port: number, hostname?: string, backlog?: number, callback?: Function) => Server;
  listen: (path: string, callback?: Function) => Server;
  listen: (handle: Object, callback?: Function) => Server;
}
