import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Button } from 'network-canvas-ui';
import { actionCreators as protocolActions } from '../ducks/modules/protocol';
import { Form } from '../containers/';
import { isElectron, isCordova } from '../utils/Environment';
import logo from '../images/NC-Round.svg';

const formConfig = {
  formName: 'setup',
  fields: [
    {
      label: 'Protocol URL',
      name: 'protocol_url',
      component: 'TextInput',
      placeholder: 'Protocol URL',
      required: true,
    },
  ],
};

const initialValues = {
  protocol_url: 'https://github.com/codaco/example-protocols/raw/master/packaged/demo.netcanvas',
};

/**
  * Setup screen
  * @extends Component
  */
class Setup extends Component {
  onClickImportRemoteProtocol = (fields) => {
    if (fields) {
      this.props.downloadProtocol(fields.protocol_url);
    }
  }

  onClickLoadFactoryProtocol = (protocolName) => {
    this.props.loadFactoryProtocol(protocolName);
  }

  onDialogConfirm = () => {
    // eslint-disable-next-line no-console
    console.log('dialog confirmed');
  }

  onDialogCancel = () => {
    // eslint-disable-next-line no-console
    console.log('dialog cancelled');
  }

  renderImportButtons() {
    if (isElectron() || isCordova()) {
      return (
        <div>
          <div className="setup__custom-protocol">
            <Form
              form={formConfig.formName}
              onSubmit={this.onClickImportRemoteProtocol}
              initialValues={initialValues}
              controls={[<Button size="small" key="submit" aria-label="Import remote protocol">Import remote protocol</Button>]}
              {...formConfig}
            />
          </div>
          <br />
          <hr />
          <br />
        </div>
      );
    }

    return null;
  }

  render() {
    if (this.props.isProtocolLoaded) { return (<Redirect to={{ pathname: '/protocol' }} />); }

    return (
      <div className="setup">
        <div className="setup__header">
          <img src={logo} className="logo" alt="Network Canvas" />
          <h1 className="type--title-1">Welcome to Network Canvas Alpha 2 - Milliways</h1>
        </div>
        <p>
          Thank you for taking the time to explore this exciting new chapter in
          the development of our software. Help us to improve by giving feedback on our <u><a href="http://feedback.networkcanvas.com/">feedback website</a></u>
        </p>
        <br />

        <div className="setup__start">
          {this.renderImportButtons()}
          <p>
            <Button size="small" onClick={() => this.onClickLoadFactoryProtocol('education.netcanvas')} content="Load teaching protocol" />&nbsp;
            <Button size="small" color="platinum" onClick={() => this.onClickLoadFactoryProtocol('development.netcanvas')} content="Load development protocol" />
          </p>
        </div>
      </div>
    );
  }
}

Setup.propTypes = {
  isProtocolLoaded: PropTypes.bool.isRequired,
  loadProtocol: PropTypes.func.isRequired,
  loadFactoryProtocol: PropTypes.func.isRequired,
  downloadProtocol: PropTypes.func.isRequired,
  importProtocol: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return {
    isProtocolLoaded: state.protocol.isLoaded,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    downloadProtocol: bindActionCreators(protocolActions.downloadProtocol, dispatch),
    importProtocol: bindActionCreators(protocolActions.importProtocol, dispatch),
    loadProtocol: bindActionCreators(protocolActions.loadProtocol, dispatch),
    loadFactoryProtocol: bindActionCreators(protocolActions.loadFactoryProtocol, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Setup);
