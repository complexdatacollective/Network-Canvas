import React, { Component } from 'react';
import { compose } from 'redux';
import { throttle } from 'lodash';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Flipper } from 'react-flip-toolkit';
import cx from 'classnames';
import { getCSSVariableAsString } from '@codaco/ui/lib/utils/CSSVariables';
import { makeNetworkNodesForType, makeGetVariableOptions, makeGetPromptVariable, getPromptOtherVariable } from '../../selectors/interface';
import { makeGetNodeLabel, makeGetNodeColor } from '../../selectors/network';
import { MonitorDragSource } from '../../behaviours/DragAndDrop';
import { entityAttributesProperty } from '../../ducks/modules/network';
import getAbsoluteBoundingRect from '../../utils/getAbsoluteBoundingRect';
import CategoricalListItem from './CategoricalListItem';
import { getItemSize, getExpandedSize } from './helpers';

/**
  * CategoricalList: Renders a list of categorical bin items
  */
class CategoricalList extends Component {
  constructor(props) {
    super(props);
    this.categoricalListElement = React.createRef();
  }

  componentWillMount() {
    this.colorPresets = [
      getCSSVariableAsString('--cat-color-seq-1'),
      getCSSVariableAsString('--cat-color-seq-2'),
      getCSSVariableAsString('--cat-color-seq-3'),
      getCSSVariableAsString('--cat-color-seq-4'),
      getCSSVariableAsString('--cat-color-seq-5'),
      getCSSVariableAsString('--cat-color-seq-6'),
      getCSSVariableAsString('--cat-color-seq-7'),
      getCSSVariableAsString('--cat-color-seq-8'),
      getCSSVariableAsString('--cat-color-seq-9'),
      getCSSVariableAsString('--cat-color-seq-10'),
    ];
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize);
    this.onResize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  onResize = throttle(() => {
    this.forceUpdate();
  }, 1000 / 60);

  get binSizes() {
    if (!this.categoricalListElement.current) {
      return [];
    }

    const categoricalListElement = this.categoricalListElement.current;

    const bounds = getAbsoluteBoundingRect(categoricalListElement);

    const expandedSize = getExpandedSize(bounds);

    const itemSize = getItemSize(
      bounds,
      this.props.bins.length,
      this.isExpanded,
    );

    return {
      expandedSize,
      itemSize,
    };
  }

  get isExpanded() {
    return this.props.expandedBinIndex !== null;
  }

  getCatColor = (itemNumber) => {
    if (itemNumber >= 0) { return this.colorPresets[itemNumber % this.colorPresets.length]; }
    return null;
  };

  getBinSize = index =>
    (this.props.expandedBinIndex === index ? this.binSizes.expandedSize : this.binSizes.itemSize);

  renderCategoricalBins = () => {
    const {
      bins,
      stage,
      prompt,
      activePromptVariable,
      promptOtherVariable,
      getNodeLabel,
      nodeColor,
      onExpandBin,
      expandedBinIndex,
    } = this.props;

    return bins
      .map((bin, index) => (
        <CategoricalListItem
          id={`CATBIN_ITEM_${stage.id}_${prompt.id}_${index}`}
          key={index}
          index={index}
          getNodeLabel={getNodeLabel}
          nodeColor={nodeColor}
          bin={bin}
          size={this.getBinSize(index)}
          activePromptVariable={activePromptVariable}
          promptOtherVariable={promptOtherVariable}
          accentColor={this.getCatColor(index)}
          onExpandBin={onExpandBin}
          isExpanded={expandedBinIndex === index}
          sortOrder={prompt.binSortOrder}
        />
      ));
  };

  render() {
    const { bins, expandedBinIndex, onExpandBin } = this.props;

    const listClasses = cx(
      'categorical-list',
      `categorical-list--items--${bins.length}`,
      { 'categorical-list--expanded': expandedBinIndex !== null },
    );

    // Render before filter, because we need to preserve order for colors.
    const categoricalBins = this.renderCategoricalBins();

    const expandedBin = categoricalBins[expandedBinIndex];

    const otherBins = categoricalBins.filter(
      (_, index) => index !== expandedBinIndex,
    );

    return (
      <div
        className={listClasses}
        ref={this.categoricalListElement}
        onClick={(e) => { e.stopPropagation(); onExpandBin(); }}
      >
        <Flipper
          flipKey={expandedBinIndex}
          className="categorical-list__items"
        >
          {expandedBin}
          {otherBins}
        </Flipper>
      </div>
    );
  }
}

CategoricalList.propTypes = {
  activePromptVariable: PropTypes.string.isRequired,
  promptOtherVariable: PropTypes.string,
  bins: PropTypes.array.isRequired,
  getNodeLabel: PropTypes.func.isRequired,
  nodeColor: PropTypes.string.isRequired,
  prompt: PropTypes.object.isRequired,
  stage: PropTypes.object.isRequired,
  expandedBinIndex: PropTypes.number,
  onExpandBin: PropTypes.func.isRequired,
};

CategoricalList.defaultProps = {
  expandedBinIndex: null,
  promptOtherVariable: null,
  isDragging: false,
  meta: {},
};

const matchVariable = (node, variable, value) => (
  node[entityAttributesProperty][variable] &&
  node[entityAttributesProperty][variable].includes(value)
);

const hasOtherVariable = (node, otherVariable) =>
  otherVariable && node[entityAttributesProperty][otherVariable] !== null;

const matchBin = (bin, variable) =>
  node =>
    matchVariable(node, variable, bin.value) || hasOtherVariable(node, bin.otherVariable);

const appendNodesForBin = (nodes, activePromptVariable) =>
  bin => ({
    ...bin,
    nodes: nodes.filter(matchBin(bin, activePromptVariable)),
  });

function makeMapStateToProps() {
  const getCategoricalValues = makeGetVariableOptions(true);
  const getPromptVariable = makeGetPromptVariable();
  const getStageNodes = makeNetworkNodesForType();

  return function mapStateToProps(state, props) {
    const stageNodes = getStageNodes(state, props);
    const activePromptVariable = getPromptVariable(state, props);
    const [promptOtherVariable, promptOtherVariablePrompt] = getPromptOtherVariable(state, props);
    const getNodeLabel = makeGetNodeLabel();
    const getNodeColor = makeGetNodeColor();
    const bins = getCategoricalValues(state, props)
      .map(appendNodesForBin(stageNodes, activePromptVariable));

    return {
      activePromptVariable,
      promptOtherVariable,
      promptOtherVariablePrompt,
      bins,
      getNodeLabel: getNodeLabel(state, props),
      nodeColor: getNodeColor(state, props),
    };
  };
}

export { CategoricalList };

export default compose(
  connect(makeMapStateToProps),
  MonitorDragSource(['isDragging', 'meta']),
)(CategoricalList);