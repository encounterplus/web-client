# Web Client for Encounter+ App

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.0.1.

# Installing

Run `npm ci` to install all locale packages, then `npm install -g @angular/cli` to provide the `ng` command line tool used elsewhere.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Releasing

`package.json` owns the version; `src/manifest.json` follows it. Bump both and tag in one step, then push:

```
npm version 0.9.18
git push --follow-tags
```

The tag triggers the Release workflow, which builds with the production configuration and publishes `web-client.zip` and `manifest.json` as a GitHub release titled `v0.9.18`. A pre-release suffix (`npm version 0.9.18-beta`) publishes a pre-release, which Encounter+ lists but never offers as an update. The workflow refuses to release when the tag, `package.json` and `src/manifest.json` disagree.

To rebuild an existing release, run the Release workflow by hand with its tag; the assets are replaced.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
