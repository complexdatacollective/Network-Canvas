/* eslint-env jest */

import { Application } from 'spectron';
import path from 'path';
import { kebabCase } from 'lodash';
import { timing, developmentProtocol, getAppConfiguration, defaultImageSnaphotConfig } from '../config';

const pluralize = f => (...apps) => Promise.all(apps.map(app => f(app)));

export const makeTestingApp = () => {
  const appConfiguration = getAppConfiguration();
  return new Application(appConfiguration);
};

export const startApp = async (app) => {
  await app.start();
  await app.client.waitUntilWindowLoaded();
  await app.client.pause(timing.medium);
};

export const startApps = pluralize(startApp);

export const stopApp = async (app) => {
  if (app && app.isRunning()) {
    return app.stop().catch(() => {});
  }
  return Promise.resolve();
};

export const stopApps = pluralize(stopApp);

export const resetApp = async (app) => {
  await app.client.execute(() => {
    window.localStorage.clear();
  });
  await app.webContents.reload();
  await app.client.waitUntilWindowLoaded();
  await app.client.pause(timing.medium);
};

export const resetApps = pluralize(resetApp);

/**
 * For reuse when testing interfaces
 */
export const loadDevelopmentProtocol = async (app) => {
  await app.client.isVisible('.getting-started');
  await app.client.click('[name=add-a-protocol]');
  await app.client.waitForVisible('.protocol-import-dialog__tabs');
  await app.client.click('.tab=From URL');
  await app.client.$('input[name=protocol_url]').setValue(developmentProtocol);
  await app.client.click('button=Import');
  await app.client.waitForVisible('h4=Protocol imported successfully!', 600000); // 10mins
  await app.client.click('button=Continue');
  await app.client.waitForExist('.modal', timing.long, true); // wait for not exist
};

export const resizeApp = (_app, width, height) =>
  async () => {
    await _app.browserWindow.setSize(width, height);
    await _app.client.url('#/reset');
    await _app.client.pause(timing.medium); // wait for assets/fonts to load
  };

/**
 * Clicks on element using dom apis.
 *
 * Useful when websocketio refuses to click on an element
 * that it considers 'unclickable'.
 *
 * @param {object} _app Spectron app object
 * @param {string} _selector querySelector
 */
export const forceClick = async (_app, _selector) => {
  await _app.client.waitForVisible(_selector);
  await _app.client.execute((selector) => {
    window.document.querySelector(selector).click();
  }, _selector);
};

const getImageSnaphotConfig = async app =>
  app.client.execute(() => window.devicePixelRatio)
    .then(({ value: devicePixelRatio }) => ({
      ...defaultImageSnaphotConfig,
      customSnapshotIdentifier: ({ testPath, currentTestName, counter }) =>
        `${devicePixelRatio}x-`
          .concat(kebabCase(`${path.basename(testPath)}-${currentTestName}-${counter}`)),
    }));

export const matchImageSnapshot = async (app) => {
  await getImageSnaphotConfig(app)
    .then(imageSnaphotConfig =>
      expect(app.browserWindow.capturePage())
        .resolves.toMatchImageSnapshot(imageSnaphotConfig),
    );
};