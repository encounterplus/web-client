import version from 'src/app/version';

export const environment = {
  production: true,
  config: {
    defaults: {
      AUTO_RECONNECT: true
    }
  },
  version: version
};