import { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'expo-modules-core';
import { unmockAllProperties } from 'jest-expo';

import { describeManifestTypes, mockConstants } from './ManifestTestUtils';

beforeEach(() => {
  unmockAllProperties();
  jest.resetModules();
  jest.resetAllMocks();
});

describe('getStartUrl', () => {
  describeManifestTypes(
    { id: '@test/test', originalFullName: '@example/abc', scheme: 'my-app' },
    {
      extra: {
        expoClient: {
          name: 'wat',
          slug: 'wat',
          originalFullName: '@example/abc',
          scheme: 'my-app',
        },
      },
    }
  )((manifestObj) => {
    it(`returns the correct start URL from getStartUrl`, () => {
      mockConstants({}, manifestObj);

      const { SessionUrlProvider } = require('../SessionUrlProvider');
      const managedSessionUrlProvider = new SessionUrlProvider();

      const authUrl = 'https://signin.com';
      const returnUrl = 'exp://exp.host/@example/abc+';
      const result = managedSessionUrlProvider.getStartUrl(
        authUrl,
        returnUrl,
        /* proxyProjectIdOverride */ undefined
      );
      expect(result).toEqual(
        Platform.select({
          default:
            'https://auth.expo.io/@example/abc/start?authUrl=https%3A%2F%2Fsignin.com&returnUrl=exp%3A%2F%2Fexp.host%2F%40example%2Fabc%2B',
          web: Platform.isDOMAvailable
            ? 'http://localhost/start?authUrl=https%3A%2F%2Fsignin.com&returnUrl=exp%3A%2F%2Fexp.host%2F%40example%2Fabc%2B'
            : '',
        })
      );
    });

    it('returns correct start URL when proxyProjectIdOverride is supplied', () => {
      const authUrl = 'https://signin.com';
      const returnUrl = 'exp://exp.host/@example/abc+';

      mockConstants({}, manifestObj);

      const { SessionUrlProvider } = require('../SessionUrlProvider');
      const managedSessionUrlProvider = new SessionUrlProvider();

      const result = managedSessionUrlProvider.getStartUrl(authUrl, returnUrl, '@hello/world');
      expect(result).toEqual(
        Platform.select({
          default:
            'https://auth.expo.io/@hello/world/start?authUrl=https%3A%2F%2Fsignin.com&returnUrl=exp%3A%2F%2Fexp.host%2F%40example%2Fabc%2B',
          web: Platform.isDOMAvailable
            ? 'http://localhost/start?authUrl=https%3A%2F%2Fsignin.com&returnUrl=exp%3A%2F%2Fexp.host%2F%40example%2Fabc%2B'
            : '',
        })
      );
    });
  });
});

describe(`getRedirectUrl`, () => {
  // All native apps kinda work the same in SDK 41+ :kinda_cool_guy:
  for (const execution of [
    ExecutionEnvironment.StoreClient,
    ExecutionEnvironment.Bare,
    ExecutionEnvironment.Standalone,
  ]) {
    describe(execution, () => {
      const originalWarn = console.warn;

      beforeEach(() => {
        console.warn = jest.fn();
      });
      afterEach(() => (console.warn = originalWarn));

      describeManifestTypes(
        { id: '@test/test', originalFullName: '@example/abc', scheme: 'my-app' },
        {
          extra: {
            expoClient: {
              name: 'wat',
              slug: 'wat',
              originalFullName: '@example/abc',
              scheme: 'my-app',
            },
          },
        }
      )((manifestObj) => {
        it(`checks return url`, () => {
          mockConstants({ executionEnvironment: execution }, manifestObj);

          const { SessionUrlProvider } = require('../SessionUrlProvider');
          const managedSessionUrlProvider = new SessionUrlProvider();

          expect(managedSessionUrlProvider.getRedirectUrl({})).toEqual(
            Platform.select({
              default: 'https://auth.expo.io/@example/abc',
              web: Platform.isDOMAvailable ? 'http://localhost' : '',
            })
          );
        });
      });

      if (Platform.OS !== 'web') {
        describeManifestTypes(
          { id: undefined, originalFullName: undefined, scheme: 'my-app' },
          {
            extra: {
              expoClient: {
                name: 'wat',
                slug: 'wat',
                originalFullName: undefined,
                scheme: 'my-app',
              },
            },
          }
        )((manifestObj) => {
          it(`throws a useful error if originalFullName and id are not defined`, () => {
            mockConstants({ executionEnvironment: execution }, manifestObj);

            const { SessionUrlProvider } = require('../SessionUrlProvider');
            const managedSessionUrlProvider = new SessionUrlProvider();

            const errorName = {
              [ExecutionEnvironment.StoreClient]: manifestObj.manifest2
                ? `Cannot use the AuthSession proxy because the project full name is not defined. Prefer AuthRequest (with the useProxy option set to false) in combination with an Expo Development Client build of your application. To continue using the AuthSession proxy, specify the project full name (@owner/slug) using the projectNameForProxy option.`
                : `Cannot use the AuthSession proxy because the project full name is not defined. Please report this as a bug`,
              [ExecutionEnvironment.Bare]: manifestObj.manifest2
                ? `Cannot use the AuthSession proxy because the project full name is not defined. Prefer AuthRequest (with the useProxy option set to false) in combination with an Expo Development Client build of your application. To continue using the AuthSession proxy, specify the project full name (@owner/slug) using the projectNameForProxy option.`
                : `Cannot use the AuthSession proxy because the project full name is not defined. Please ensure you have the latest`,
              [ExecutionEnvironment.Standalone]: `Cannot use the AuthSession proxy because the project full name is not defined.`,
            };
            expect(() => managedSessionUrlProvider.getRedirectUrl({})).toThrowError(
              errorName[execution]
            );
          });
        });
      }
    });
  }
});

if (Platform.OS !== 'web') {
  describe(`getDefaultReturnUrl`, () => {
    describe('storeClient', () => {
      describeManifestTypes(
        { scheme: 'my-app', hostUri: 'exp.host/@example/abc' },
        {
          extra: {
            expoClient: {
              name: 'wat',
              slug: 'wat',
              scheme: 'my-app',
              hostUri: 'exp.host/@example/abc',
            },
          },
        }
      )((manifestObj) => {
        it(`checks return url`, () => {
          mockConstants({ executionEnvironment: ExecutionEnvironment.StoreClient }, manifestObj);

          const { SessionUrlProvider } = require('../SessionUrlProvider');
          const managedSessionUrlProvider = new SessionUrlProvider();

          expect(managedSessionUrlProvider.getDefaultReturnUrl()).toEqual(
            'exp://exp.host/@example/abc/--/expo-auth-session'
          );
        });
      });

      describeManifestTypes(
        { scheme: 'my-app', hostUri: 'exp.host/@example/abc' },
        {
          extra: {
            expoClient: {
              name: 'wat',
              slug: 'wat',
              scheme: 'my-app',
              hostUri: 'exp.host/@example/abc',
            },
          },
        }
      )((manifestObj) => {
        it(`checks return url with options`, () => {
          mockConstants({ executionEnvironment: ExecutionEnvironment.StoreClient }, manifestObj);

          const { SessionUrlProvider } = require('../SessionUrlProvider');
          const managedSessionUrlProvider = new SessionUrlProvider();

          const result = managedSessionUrlProvider.getDefaultReturnUrl('/foobar', {
            isTripleSlashed: true,
            scheme: 'foobar',
          });
          expect(result).toEqual('exp://exp.host/@example/abc/--/expo-auth-session/foobar');
        });
      });

      describeManifestTypes(
        { scheme: ['my-app-1', 'my-app-2'], hostUri: 'exp.host/@test/test' },
        {
          extra: {
            expoClient: {
              name: 'exp.host',
              slug: 'exp.host',
              scheme: ['my-app-1', 'my-app-2'],
              hostUri: 'exp.host/@test/test',
            },
          },
        }
      )((manifestObj) => {
        it(`checks return url with multiple schemes and no default provided`, () => {
          mockConstants({ executionEnvironment: ExecutionEnvironment.StoreClient }, manifestObj);

          const { SessionUrlProvider } = require('../SessionUrlProvider');
          const managedSessionUrlProvider = new SessionUrlProvider();

          // Ensure no warning is thrown in store client
          expect(managedSessionUrlProvider.getDefaultReturnUrl()).toEqual(
            'exp://exp.host/@test/test/--/expo-auth-session'
          );
        });
      });

      describeManifestTypes(
        { scheme: 'my-app', hostUri: 'exp.host/@example/abc?release-channel=release-channel' },
        {
          extra: {
            expoClient: {
              name: 'wat',
              slug: 'wat',
              scheme: 'my-app',
              hostUri: 'exp.host/@example/abc?release-channel=release-channel',
            },
          },
        }
      )((manifestObj) => {
        it(`checks url with the release channel`, () => {
          mockConstants({ executionEnvironment: ExecutionEnvironment.StoreClient }, manifestObj);

          const { SessionUrlProvider } = require('../SessionUrlProvider');
          const managedSessionUrlProvider = new SessionUrlProvider();

          expect(managedSessionUrlProvider.getDefaultReturnUrl()).toEqual(
            'exp://exp.host/@example/abc/--/expo-auth-session?release-channel=release-channel'
          );
        });
      });
    });

    // Custom apps should all work the same in SDK 41+ :cool_guy_emoji:
    for (const execution of [ExecutionEnvironment.Bare, ExecutionEnvironment.Standalone]) {
      describe(execution, () => {
        const originalWarn = console.warn;

        beforeEach(() => {
          console.warn = jest.fn();
        });
        afterEach(() => (console.warn = originalWarn));

        describeManifestTypes(
          { scheme: 'my-app', hostUri: 'exp.host/@example/abc' },
          {
            extra: {
              expoClient: {
                name: 'wat',
                slug: 'wat',
                scheme: 'my-app',
                hostUri: 'exp.host/@example/abc',
              },
            },
          }
        )((manifestObj) => {
          it(`checks return url`, () => {
            mockConstants({ executionEnvironment: execution }, manifestObj);

            const { SessionUrlProvider } = require('../SessionUrlProvider');
            const managedSessionUrlProvider = new SessionUrlProvider();

            const result = managedSessionUrlProvider.getDefaultReturnUrl();

            expect(result).toEqual('my-app://expo-auth-session');
          });
        });

        describeManifestTypes(
          { scheme: undefined, hostUri: 'exp.host/@test/test' },
          {
            extra: {
              expoClient: {
                name: 'wat',
                slug: 'wat',
                scheme: undefined,
                hostUri: 'exp.host/@test/test',
              },
            },
          }
        )((manifestObj) => {
          it(`throws if no scheme is defined`, () => {
            mockConstants({ executionEnvironment: execution }, manifestObj);

            const { SessionUrlProvider } = require('../SessionUrlProvider');
            const managedSessionUrlProvider = new SessionUrlProvider();

            expect(() => managedSessionUrlProvider.getDefaultReturnUrl()).toThrow(
              'not make a deep link into a standalone app with no custom scheme defined'
            );
          });
        });

        describeManifestTypes(
          { scheme: 'my-app', hostUri: 'exp.host/@example/abc' },
          {
            extra: {
              expoClient: {
                name: 'wat',
                slug: 'wat',
                scheme: 'my-app',
                hostUri: 'exp.host/@example/abc',
              },
            },
          }
        )((manifestObj) => {
          it(`checks return url with options`, () => {
            mockConstants({ executionEnvironment: execution }, manifestObj);

            const { SessionUrlProvider } = require('../SessionUrlProvider');
            const managedSessionUrlProvider = new SessionUrlProvider();

            const result = managedSessionUrlProvider.getDefaultReturnUrl('/foobar', {
              isTripleSlashed: true,
              scheme: 'foobar',
            });
            // ensure we warn about the invalid config or invocation.
            expect(console.warn).toHaveBeenCalledWith(
              `The provided Linking scheme 'foobar' does not appear in the list of possible URI schemes in your Expo config. Expected one of: 'my-app'`
            );
            expect(result).toEqual('foobar:///expo-auth-session/foobar');
          });
        });

        describeManifestTypes(
          { scheme: ['my-app-1', 'my-app-2'], hostUri: 'exp.host/@test/test' },
          {
            extra: {
              expoClient: {
                name: 'wat',
                slug: 'wat',
                scheme: ['my-app-1', 'my-app-2'],
                hostUri: 'exp.host/@test/test',
              },
            },
          }
        )((manifestObj) => {
          it(`checks return url with multiple schemes and no default provided`, () => {
            mockConstants({ executionEnvironment: execution }, manifestObj);

            const { SessionUrlProvider } = require('../SessionUrlProvider');
            const managedSessionUrlProvider = new SessionUrlProvider();

            const result = managedSessionUrlProvider.getDefaultReturnUrl();
            // Ensure we silenced the warnings when multiple schemes can be found.
            expect(console.warn).not.toHaveBeenCalled();
            expect(result).toEqual('my-app-1://expo-auth-session');
          });
        });

        describeManifestTypes(
          { scheme: 'my-app', hostUri: 'exp.host/@example/abc?release-channel=release-channel' },
          {
            extra: {
              expoClient: {
                name: 'wat',
                slug: 'wat',
                scheme: 'my-app',
                hostUri: 'exp.host/@example/abc?release-channel=release-channel',
              },
            },
          }
        )((manifestObj) => {
          it(`checks url with the release channel`, () => {
            mockConstants({ executionEnvironment: execution }, manifestObj);

            const { SessionUrlProvider } = require('../SessionUrlProvider');
            const managedSessionUrlProvider = new SessionUrlProvider();

            expect(managedSessionUrlProvider.getDefaultReturnUrl()).toEqual(
              'my-app://expo-auth-session?release-channel=release-channel'
            );
          });
        });
      });
    }
  });
}
