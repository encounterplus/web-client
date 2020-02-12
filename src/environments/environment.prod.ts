import version from 'src/app/version';

export const environment = {
  production: true,
  config: {
    defaults: {
      HOST: "localhost:8080",
      AUTO_RECONNECT: true
    }
  },
  version: version
};
