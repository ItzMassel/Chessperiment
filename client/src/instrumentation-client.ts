import { initBotId } from "botid/client/core";

export function register() {
  initBotId({ protect: [{ path: '/api/auth/*', method: 'POST' }] });
}
