/* eslint-disable */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import PropTypes from 'prop-types';
import {
  NarrativeControlPanel,
  Annotations,
} from '../Canvas';

import {
  Canvas,
  ConcentricCircles,
} from '../../components/Canvas';

/**
  * Narrative Interface
  * @extends Component
  */
class Narrative extends Component {
  constructor() {
    super();
    this.state = {
      presetIndex: 0,
    };
  }

  render() {
    const {
      stage,
    } = this.props;

    const subject = stage.subject;
    const presets = stage.presets;
    const currentPreset = presets[this.state.presetIndex];
    const layoutVariable = currentPreset.layoutVariable;
    const highlight = currentPreset.highlight && currentPreset.highlight[0].variable;
    const displayEdges = (currentPreset.edges && currentPreset.edges.display) || [];
    const convexHulls = currentPreset.groupVariable;

    const backgroundImage = stage.background && stage.background.image;
    const concentricCircles = stage.background && stage.background.concentricCircles;
    const skewedTowardCenter = stage.background && stage.background.skewedTowardCenter;
    const freeDraw = stage.behaviours && stage.behaviours.freeDraw;

    return (
      <div className="narrative-interface">
        <div className="narrative-interface__canvas" id="narrative-interface__canvas">
          <Canvas>
            <NarrativeControlPanel />
            <Annotations freeDraw={freeDraw} />
            <ConcentricCircles
              subject={subject}
              layoutVariable={layoutVariable}
              highlight={highlight}
              displayEdges={displayEdges}
              convexHulls={convexHulls}
              backgroundImage={backgroundImage}
              concentricCircles={concentricCircles}
              skewedTowardCenter={skewedTowardCenter}
              key={currentPreset.id}
            />
          </Canvas>
        </div>
      </div>
    );
  }
}

Narrative.propTypes = {
  stage: PropTypes.object.isRequired,
};

function mapStateToProps(state, ownProps) {
  return {
    stage: ownProps.stage || stages(state)[ownProps.stageIndex],
  };
}

const mapDispatchToProps = () => ({
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
)(Narrative);