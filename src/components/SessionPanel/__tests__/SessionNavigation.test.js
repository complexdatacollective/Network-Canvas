/* eslint-env jest */

import React from 'react';
import { mount } from 'enzyme';
import * as framer from 'framer-motion';
import SessionNavigation from '../SessionNavigation';

describe('Session Navigation Component', () => {
  const showSubMenuMock = jest.fn();
  const setExpandedMock = jest.fn();
  const backMock = jest.fn();
  const nextMock = jest.fn();

  framer.useInvertedScale = jest.fn(() => ({ scaleX: 1, scaleY: 1 }));

  let component = null;

  beforeEach(() => {
    component = mount(
      <SessionNavigation
        percentProgress="40"
        onClickBack={backMock}
        onClickNext={nextMock}
        setShowSubMenu={showSubMenuMock}
        setExpanded={setExpandedMock}
      />,
    );
  });

  it('toggles menu on timeline click', () => {
    expect(showSubMenuMock.mock.calls.length).toBe(0);
    component.find('.progress-bar').simulate('click');
    expect(showSubMenuMock.mock.calls.length).toBe(1);
  });

  it('calls back function on clicking back button', () => {
    expect(backMock.mock.calls.length).toBe(0);
    component.find('div.session-navigation__button--back').simulate('click');
    expect(backMock.mock.calls.length).toBe(1);
  });

  it('calls next function on clicking next button', () => {
    expect(nextMock.mock.calls.length).toBe(0);
    component.find('div.session-navigation__button--next').simulate('click');
    expect(nextMock.mock.calls.length).toBe(1);
  });
});
