/* eslint-disable no-nested-ternary */
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '@codaco/ui';
import { find } from 'lodash';
import compareVersions from 'compare-versions';
import ReactMarkdown from 'react-markdown';
import { actionCreators as toastActions } from '../ducks/modules/toasts';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';
import getVersion from '../utils/getVersion';
import ExternalLink, { openExternalLink } from '../components/ExternalLink';
import { isAndroid, isIOS, isMacOS, isWindows } from '../utils/Environment';
import useDismissedUpdatesState from './useDismissedUpdatesState';

// Custom renderer for links so that they open correctly in an external browser
const renderers = {
  link: ({ children, href }) => <ExternalLink href={href}>{children}</ExternalLink>,
};

const getPlatformSpecificContent = (assets) => {
  if (isIOS()) {
    return {
      buttonText: 'Open App Store',
      onClickHandler: () => openExternalLink('https://apps.apple.com/us/app/network-canvas-interviewer/id1538673677'),
    };
  }

  if (isAndroid()) {
    return {
      buttonText: 'Open Play Store',
      onClickHandler: () => openExternalLink('https://play.google.com/store/apps/details?id=org.codaco.NetworkCanvasInterviewer6'),
    };
  }

  if (!assets || assets.length === 0) {
    return {
      buttonText: 'Open Download Page',
      onClickHandler: () => openExternalLink('https://networkcanvas.com/download.html'),
    };
  }

  if (isMacOS()) {
    // eslint-disable-next-line @codaco/spellcheck/spell-checker
    const dmg = find(assets, value => value.name.split('.').pop() === 'dmg');
    return {
      buttonText: 'Download Installer',
      onClickHandler: () => openExternalLink(dmg.browser_download_url),
    };
  }

  if (isWindows()) {
    // eslint-disable-next-line @codaco/spellcheck/spell-checker
    const exe = find(assets, value => value.name.split('.').pop() === 'exe');
    return {
      buttonText: 'Download Installer',
      onClickHandler: () => openExternalLink(exe.browser_download_url),
    };
  }

  return {
    buttonText: 'Open Download Page',
    onClickHandler: () => openExternalLink('https://networkcanvas.com/download.html'),
  };
};

const checkEndpoint = updateEndpoint => new Promise((resolve) => {
  getVersion().then(currentVersion => fetch(updateEndpoint)
    .then(response => response.json())
    .then(({ name, body, assets }) => {
      if (compareVersions.compare(currentVersion, name, '<')) {
        resolve({
          newVersion: name,
          releaseNotes: body,
          releaseButtonContent: getPlatformSpecificContent(assets),
        });
      }

      // eslint-disable-next-line no-console
      console.info(`No update available (current: ${currentVersion}, latest: ${name}).`);
      resolve(false);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.warn('Error checking for updates:', error);
      resolve(false); // Don't reject, as we don't want to handle this error - just fail silently.
    }));
});


const useUpdater = (updateEndpoint, timeout = 0) => {
  const dispatch = useDispatch();
  const [dismissedVersion, setDismissedVersion] = useDismissedUpdatesState('dismissedVersion');

  const handleDismiss = (version) => {
    setDismissedVersion(version);
    dispatch(toastActions.removeToast('update-toast'));
  };

  const showReleaseNotes = (releaseNotes, releaseButtonContent) => {
    const { buttonText, onClickHandler } = releaseButtonContent;

    dispatch(dialogActions.openDialog({
      type: 'Confirm',
      title: 'Release Notes',
      confirmLabel: buttonText,
      onConfirm: onClickHandler,
      message: (
        <div className="dialog-release-notes allow-text-selection">
          <p>
            Please read the following release notes carefully as changes in the software
            may impact the interview experience substantially, and in some cases may even prevent
            you from collecting data until further updates are installed.
          </p>
          <ReactMarkdown
            className="dialog-release-notes__notes"
            renderers={renderers}
            source={releaseNotes}
          />
        </div>
      ),
    }));
  };

  const checkForUpdate = async () => {
    const updateAvailable = await checkEndpoint(updateEndpoint);
    if (!updateAvailable) { return; }

    const {
      newVersion,
      releaseNotes,
      releaseButtonContent,
    } = updateAvailable;

    // Don't notify the user if they have dismissed this version.
    if (dismissedVersion && dismissedVersion.includes(newVersion)) {
      return;
    }

    dispatch(toastActions.addToast({
      id: 'update-toast',
      type: 'info',
      classNames: 'update-available-toast',
      title: `Version ${newVersion} available`,
      autoDismiss: false,
      content: (
        <React.Fragment>
          <p>
            A new version of Network Canvas Interviewer is available. To
            upgrade, see the link in the release notes.
          </p>
          <div className="toast-button-group">
            <Button color="platinum--dark" onClick={() => handleDismiss(newVersion)}>Hide for this release</Button>
            <Button color="neon-coral" onClick={() => showReleaseNotes(releaseNotes, releaseButtonContent)}>Show Release Notes</Button>
          </div>
        </React.Fragment>
      ),
    }));
  };

  useEffect(() => {
    const delay = setTimeout(checkForUpdate, timeout);

    return () => clearTimeout(delay);
  }, [updateEndpoint]);
};

export default useUpdater;
