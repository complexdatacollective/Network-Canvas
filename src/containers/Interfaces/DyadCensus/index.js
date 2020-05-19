import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { AnimatePresence, motion } from 'framer-motion';
import ToggleButton from '@codaco/ui/lib/components/Fields/ToggleButton';
import { getCSSVariableAsNumber } from '@codaco/ui/lib/utils/CSSVariables';
import withPrompt from '../../../behaviours/withPrompt';
import { entityPrimaryKeyProperty } from '../../../ducks/modules/network';
import { makeNetworkNodesForType as makeGetNodes } from '../../../selectors/interface';
import { getNetworkEdges as getEdges } from '../../../selectors/network';
import { getProtocolCodebook } from '../../../selectors/protocol';
import ProgressBar from '../../../components/ProgressBar';
import PromptSwiper from '../../PromptSwiper';
import Node from '../../../containers/Node';
import useSteps from './useSteps';
import useNetworkEdgeState from './useEdgeState';

const animationOffset = '200%;';

const getVariants = () => {
  const slowDuration = getCSSVariableAsNumber('--animation-duration-slow-ms') / 1000;
  const duration = getCSSVariableAsNumber('--animation-duration-standard-ms') / 1000;
  const delay = getCSSVariableAsNumber('--animation-duration-slow-ms') / 1000;

  const pairTransition = {
    duration: slowDuration,
    when: 'afterChildren',
  };

  const pairVariants = {
    in: ([, shouldDelay]) => ({
      translateY: '0%',
      opacity: 1,
      position: 'static',
      transition: {
        ...pairTransition,
        ...(shouldDelay ? { delay } : {}),
      },
    }),
    initial: ([isForwards]) => ({
      translateY: isForwards ? animationOffset : `-${animationOffset}`,
      opacity: 0,
      position: 'absolute',
    }),
    exit: ([isForwards, shouldDelay]) => ({
      translateY: !isForwards ? animationOffset : `-${animationOffset}`,
      opacity: 0,
      position: 'absolute',
      transition: {
        ...pairTransition,
        ...(shouldDelay ? { delay } : {}),
      },
    }),
  };

  const edgeVariants = {
    show: { opacity: 1, transition: { duration } },
    hide: { opacity: 0, transition: { duration } },
  };

  return { edgeVariants, pairVariants };
};

/**
  * Dyad Census Interface
  */
const DyadCensus = ({
  onComplete,
  registerBeforeNext,
  promptId: promptIndex, // TODO: what is going on here?
  prompt,
  promptBackward,
  promptForward,
  stage,
  pairs,
  nodes,
  edges,
  edgeColor,
  dispatch,
}) => {
  const steps = Array(stage.prompts.length).fill(pairs.length);

  const [state, nextStep, previousStep] = useSteps(
    steps,
    promptIndex || 0,
    { onComplete, dispatch },
  );

  const getNode = id =>
    nodes.find(node => node[entityPrimaryKeyProperty] === id);

  const getPair = () => get(pairs, state.step, null);

  const [edgeState, setEdge, isTouched, isChanged] = useNetworkEdgeState(
    edges,
    getPair(),
    prompt.edge, // TODO: createEdge?
    { dispatch },
    [promptIndex, state.step],
  );

  // Auto advance
  useEffect(() => {
    if (!isTouched) { return; }
    nextStep(!isChanged);
  }, [isTouched]);

  const getHasEdge = () => {
    if (edgeState !== null) { return edgeState; }

    // If we've visited this step previously (progress), and no edge exists consider
    // this an implicit 'no'
    if (state.progress > state.step) {
      return false;
    }

    // Otherwise consider this blank
    return null;
  };

  const next = () => {
    // validate

    // go to next step
    nextStep(true);
  };

  // TODO: Should this also receive an onComplete method?
  const beforeNext = useCallback((direction) => {
    if (direction < 0) {
      previousStep(true);
      return;
    }

    next();
  }, [previousStep, next]);

  useEffect(() => {
    registerBeforeNext(beforeNext);
  }, [beforeNext]);

  const handleChange = nextValue =>
    () => {
      setEdge(nextValue);
    };

  const pair = getPair();
  const fromNode = getNode(pair[0]);
  const toNode = getNode(pair[1]);
  const isForwards = state.direction !== 'backward'; // .i.e. default to true

  const { edgeVariants, pairVariants } = getVariants();

  const shouldDelay = !state.fast;

  return (
    <div className="interface dyad-interface">
      <div className="interface__prompt">
        <PromptSwiper
          forward={promptForward}
          backward={promptBackward}
          prompt={prompt}
          prompts={stage.prompts}
        />
      </div>
      <div className="interface__main">
        <div className="dyad-interface__pairs">
          <AnimatePresence custom={[isForwards, shouldDelay]}>
            <motion.div
              className="dyad-interface__pair"
              key={`${promptIndex}_${state.step}`}
              custom={[isForwards, shouldDelay]}
              variants={pairVariants}
              initial="initial"
              animate="in"
              exit="exit"
            >
              <div className="dyad-interface__nodes">
                <Node {...fromNode} />
                <motion.div
                  className="dyad-interface__edge"
                  style={{ backgroundColor: `var(--${edgeColor})` }}
                  variants={edgeVariants}
                  initial="hide"
                  animate={getHasEdge() ? 'show' : 'hide'}
                />
                <Node {...toNode} />
              </div>
              <ToggleButton
                input={{
                  onChange: handleChange(true),
                  value: !!getHasEdge(),
                }}
                label="Yes"
              />
              <ToggleButton
                input={{
                  onChange: handleChange(false),
                  value: !getHasEdge() && getHasEdge() !== null,
                }}
                label="No"
              />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="dyad-interface__progress">
          <h6 className="progress-container__status-text">
            <strong>{state.step + 1}</strong> of <strong>{pairs.length}</strong>
          </h6>
          <ProgressBar orientation="horizontal" percentProgress={((state.step + 1) / pairs.length) * 100} />
        </div>
      </div>
    </div>
  );
};

DyadCensus.defaultProps = {
  form: null,
};

DyadCensus.propTypes = {
  prompt: PropTypes.object.isRequired,
  promptBackward: PropTypes.func.isRequired,
  promptForward: PropTypes.func.isRequired,
  stage: PropTypes.object.isRequired,
};

const makeMapStateToProps = () => {
  const getNodes = makeGetNodes();

  const mapStateToProps = (state, props) => {
    const nodes = getNodes(state, props);
    const edges = getEdges(state, props);
    const codebook = getProtocolCodebook(state, props);
    const nodeIds = nodes.map(node => node[entityPrimaryKeyProperty]);

    const edgeColor = get(codebook, ['edge', props.prompt.edge, 'color']);

    // mutally exclusive only
    const pairs = nodeIds.reduce(
      ({ result, pool }, id) => {
        const nextPool = pool.filter(alterId => alterId !== id);

        if (nextPool.length === 0) {
          return result;
        }

        const newPairs = nextPool.map(alterId => ([id, alterId]));

        return {
          result: [...result, ...newPairs],
          pool: nextPool,
        };
      },
      { pool: nodeIds, result: [] },
    );

    return {
      pairs,
      nodes,
      edges,
      edgeColor,
    };
  };

  return mapStateToProps;
};

export default compose(
  withPrompt,
  connect(makeMapStateToProps),
)(DyadCensus);

export {
  DyadCensus as UnconnectedDyadCensus,
};