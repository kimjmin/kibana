/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { of } from 'rxjs';
import { App, AppNavLinkStatus, AppStatus } from '../types';
import { getAppInfo } from './get_app_info';

describe('getAppInfo', () => {
  const createApp = (props: Partial<App> = {}): App => ({
    mount: () => () => undefined,
    updater$: of(() => undefined),
    id: 'some-id',
    title: 'some-title',
    status: AppStatus.accessible,
    navLinkStatus: AppNavLinkStatus.default,
    appRoute: `/app/some-id`,
    ...props,
  });

  it('converts an application and remove sensitive properties', () => {
    const app = createApp();
    const info = getAppInfo(app);

    expect(info).toEqual({
      id: 'some-id',
      title: 'some-title',
      status: AppStatus.accessible,
      navLinkStatus: AppNavLinkStatus.visible,
      appRoute: `/app/some-id`,
      meta: {
        keywords: [],
        searchDeepLinks: [],
      },
    });
  });

  it('populates default values for nested searchDeepLinks', () => {
    const app = createApp({
      meta: {
        searchDeepLinks: [
          {
            id: 'sub-id',
            title: 'sub-title',
            searchDeepLinks: [{ id: 'sub-sub-id', title: 'sub-sub-title', path: '/sub-sub' }],
          },
        ],
      },
    });
    const info = getAppInfo(app);

    expect(info).toEqual({
      id: 'some-id',
      title: 'some-title',
      status: AppStatus.accessible,
      navLinkStatus: AppNavLinkStatus.visible,
      appRoute: `/app/some-id`,
      meta: {
        keywords: [],
        searchDeepLinks: [
          {
            id: 'sub-id',
            title: 'sub-title',
            keywords: [],
            searchDeepLinks: [
              {
                id: 'sub-sub-id',
                title: 'sub-sub-title',
                path: '/sub-sub',
                keywords: [],
                searchDeepLinks: [], // default empty array added
              },
            ],
          },
        ],
      },
    });
  });

  it('computes the navLinkStatus depending on the app status', () => {
    expect(
      getAppInfo(
        createApp({
          navLinkStatus: AppNavLinkStatus.default,
          status: AppStatus.inaccessible,
        })
      )
    ).toEqual(
      expect.objectContaining({
        navLinkStatus: AppNavLinkStatus.hidden,
      })
    );
    expect(
      getAppInfo(
        createApp({
          navLinkStatus: AppNavLinkStatus.default,
          status: AppStatus.accessible,
        })
      )
    ).toEqual(
      expect.objectContaining({
        navLinkStatus: AppNavLinkStatus.visible,
      })
    );
  });

  it('adds default meta fields to sublinks when needed', () => {
    const app = createApp({
      meta: {
        searchDeepLinks: [
          {
            id: 'sub-id',
            title: 'sub-title',
            searchDeepLinks: [
              {
                id: 'sub-sub-id',
                title: 'sub-sub-title',
                path: '/sub-sub',
                keywords: ['sub sub'],
              },
            ],
          },
        ],
      },
    });
    const info = getAppInfo(app);

    expect(info).toEqual({
      id: 'some-id',
      title: 'some-title',
      status: AppStatus.accessible,
      navLinkStatus: AppNavLinkStatus.visible,
      appRoute: `/app/some-id`,
      meta: {
        keywords: [],
        searchDeepLinks: [
          {
            id: 'sub-id',
            title: 'sub-title',
            keywords: [], // default empty array
            searchDeepLinks: [
              {
                id: 'sub-sub-id',
                title: 'sub-sub-title',
                path: '/sub-sub',
                keywords: ['sub sub'],
                searchDeepLinks: [],
              },
            ],
          },
        ],
      },
    });
  });
});
