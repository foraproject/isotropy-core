/* @flow */
import promisify from "nodefunc-promisify";
import Router from "isotropy-router";

import type { IncomingMessage, ServerResponse, Server } from "./flow/http";

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

export type IsotropyOptionsType = {
  dir?: string,
  port?: number,
  router?: Router,
  handler?: (router: Router) => (req: IncomingMessage, res: ServerResponse) => any
};

export type IsotropyResultType = {
  router: Router,
  server?: Server
};

interface HttpModuleType {
  createServer: (requestListener: (req: IncomingMessage, res: ServerResponse) => any) => Server
}

type IsotropyFnType = (apps: Object, options: IsotropyOptionsType) => Promise<IsotropyResultType>;

const getIsotropy = function(plugins: Array<PluginType>, http: HttpModuleType) : IsotropyFnType {
  return async function(apps: Object, options: IsotropyOptionsType = {}) : Promise<IsotropyResultType> {
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
      const handler = options.handler ? options.handler(defaultRouter) : ((req, res) => defaultRouter.doRouting(req, res));
      const server = http.createServer(handler);
      const listen = promisify(server.listen.bind(server));
      await server.listen(port);
      return { server, router: defaultRouter };
    } else {
        return { router: defaultRouter };
    }
  };
};

export default getIsotropy;
