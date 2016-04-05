/* @flow */
import http from "http";
import promisify from "nodefunc-promisify";
import Router from "isotropy-router";
import type { IncomingMessage, ServerResponse, Server } from "isotropy-interfaces/node/http";

export type PluginType = {
  name: string,
  getDefaults: (app: Object) => Object,
  setup: (appSettings: Object, router: Router, options: PluginOptions) => Promise,
  onError?: (req: IncomingMessage, res: ServerResponse, e: any) => void
};

export type PluginOptions = {
  dir: string,
  port: number
}

type ListenerType<TIncomingMessage: IncomingMessage, TServerResponse: ServerResponse> = (req: TIncomingMessage, res: TServerResponse) => any;

type HandlerType<TIncomingMessage: IncomingMessage, TServerResponse: ServerResponse> = (router: Router) => ListenerType<TIncomingMessage, TServerResponse>;

export type IsotropyOptionsType<TIncomingMessage: IncomingMessage, TServerResponse: ServerResponse> = {
  dir?: string,
  port?: number,
  router?: Router,
  handler?: HandlerType<TIncomingMessage, TServerResponse>
};

export type IsotropyResultType<TServer : Server> = {
  router: Router,
  server?: TServer
};

type IsotropyFnType<TIncomingMessage: IncomingMessage, TServerResponse: ServerResponse> =
  (apps: Array<Object>, options: IsotropyOptionsType<TIncomingMessage, TServerResponse>) => Promise<IsotropyResultType>;

const getIsotropy= function<TIncomingMessage: IncomingMessage, TServerResponse: ServerResponse>(plugins: Array<PluginType>)
    : IsotropyFnType<TIncomingMessage, TServerResponse> {
  return async function(apps: Array<Object>, options: IsotropyOptionsType<TIncomingMessage, TServerResponse> = {}) : Promise<IsotropyResultType> {
    //if Router was passed in, we are going to assume that server was created outside.
    const onError = options.onError ||
      ((req, res, e) => {
        res.statusCode = 200;
        res.statusMessage = e.toString();
        res.end(e.toString());
      });

    const defaultRouter = options.router || new Router({ onError });

    const dir = options.dir || __dirname;
    const port = options.port || 0;

    const pluginOptions = {
      dir,
      port
    };

    for (let app of apps) {
      const plugin: PluginType = plugins.filter(p => p.name === app.type)[0];
      const appSettings = plugin.getDefaults(app);
      if (appSettings.path === "/") {
        await plugin.setup(appSettings, defaultRouter, pluginOptions);
      } else {
        const router = new Router({ onError: app.onError });
        await plugin.setup(appSettings, router, pluginOptions);
        defaultRouter.mount(appSettings.path, router);
      }
    }

    if (!options.router) {
      const handler: ListenerType<TIncomingMessage, TServerResponse> = options.handler ? options.handler(defaultRouter) : ((req, res) => defaultRouter.doRouting(req, res));
      const server = http.createServer(handler);
      const listen = promisify(server.listen.bind(server));
      await listen(port);
      return { server, router: defaultRouter };
    } else {
        return { router: defaultRouter };
    }
  };
};

export default getIsotropy;
