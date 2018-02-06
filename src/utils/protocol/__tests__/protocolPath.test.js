/* eslint-env jest */

import environments from '../../environments';
import { getEnvironment } from '../../Environment';
import protocolPath from '../protocolPath';

jest.mock('../../filesystem');

describe('protocolPath', () => {
  describe('Electron', () => {
    beforeAll(() => {
      getEnvironment.mockReturnValue(environments.ELECTRON);
    });

    it('Generates an asset path for the file', () => {
      expect(
        protocolPath('foo.canvas', 'protocol.json'),
      ).toEqual('tmp/mock/user/path/protocols/foo.canvas/protocol.json');

      expect(
        protocolPath('foo.canvas'),
      ).toEqual('tmp/mock/user/path/protocols/foo.canvas');
    });

    it('Thows an error if the protocol is not specified', () => {
      expect(() => protocolPath()).toThrow();
    });
  });
});
