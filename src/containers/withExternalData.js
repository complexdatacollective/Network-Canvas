/* eslint-disable no-underscore-dangle */
import { connect } from 'react-redux';
import {
  compose,
  withState,
  withHandlers,
  lifecycle,
  mapProps,
} from 'recompose';
import {
  get,
  mapValues,
} from 'lodash';
import loadExternalData from '../utils/loadExternalData';

const mapStateToProps = (state) => {
  const session = state.sessions[state.activeSessionId];
  const protocolUID = session.protocolUID;
  const assetFiles = mapValues(
    state.installedProtocols[protocolUID].assetManifest,
    asset => asset.source,
  );

  return {
    protocolUID,
    assetFiles,
  };
};

/**
 * Creates a higher order component which can be used to load data from network assets in
 * the assetsManifest onto a component.
 *
 * @param {string} sourceProperty - prop containing the sourceId to load
 * @param {string} dataProperty - prop name to supply the data to the child component.
 *
 * Usage:
 *
 * ```
 * // in MyComponent.js
 * // print out the json data as a string.
 * const MyComponent = ({ myExternalData }) => (
 *   <div>{JSON.stringify(myExternalData}}</div>
 * );
 *
 * export default withExternalData('mySourceId', 'myExternalData')(MyComponent);
 *
 * // in jsx block:
 *
 * <MyComponent mySourceId="hivServices" />
 * ```
 */
const withExternalData = (sourceProperty, dataProperty) =>
  compose(
    connect(mapStateToProps),
    withState(dataProperty, 'setExternalData', null),
    withHandlers({
      loadExternalData: ({
        setExternalData,
        protocolUID,
        assetFiles,
      }) =>
        (sourceId) => {
          if (!sourceId) { return; }

          setExternalData(null);

          const sourceFile = assetFiles[sourceId];

          loadExternalData(protocolUID, sourceFile)
            .then((externalData) => {
              setExternalData(externalData);
            });
        },
    }),
    lifecycle({
      componentWillReceiveProps(nextProps) {
        const nextSource = get(nextProps, sourceProperty);
        const currentSource = get(this.props, sourceProperty);

        if (nextSource !== currentSource) {
          this.props.loadExternalData(nextSource);
        }
      },
      componentDidMount() {
        const source = get(this.props, sourceProperty);
        if (!source) { return; }
        this.props.loadExternalData(source);
      },
    }),
    mapProps(
      ({
        setAbortController,
        abortController,
        setExternalData,
        loadExternalData: _, // shadows upper scope otherwise
        ...props
      }) => props,
    ),
  );

export default withExternalData;