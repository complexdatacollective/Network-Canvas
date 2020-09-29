/* eslint-disable react/no-find-dom-node, react/sort-comp */

import React, { useEffect, useRef, useState } from 'react';
import DragPreview from './DragPreview';
import DragManager, { VERTICAL_SCROLL } from './DragManager';
import { actionCreators as actions } from './reducer';
import store from './store';

const dragSource = WrappedComponent =>
  ({
    allowDrag = true,
    meta = () => ({}),
    scrollDirection = VERTICAL_SCROLL,
    ...rest
  }) => {
    const node = useRef();
    let dragManager = null;
    let preview = null;

    const [isDragging, setIsDragging] = useState(false);

    const cleanupDragManager = () => {
      if (dragManager) {
        dragManager.unmount();
        dragManager = null;
      }
    };

    const cleanupPreview = () => {
      if (preview) {
        preview.cleanup();
        preview = null;
      }
    };

    const createPreview = () => {
      const draggablePreview = new DragPreview(node.current);
      preview = draggablePreview;
    };

    const updatePreview = ({ x, y }) => {
      if (preview) {
        preview.position({ x, y });
      }
    };

    const setValidMove = (valid) => {
      preview.setValidMove(valid);
    };

    const onDragStart = (movement) => {
      createPreview();

      store.dispatch(
        actions.dragStart({
          ...movement,
          meta: meta(),
        }),
      );

      setIsDragging(true);
    };

    const onDragMove = ({ x, y, ...other }) => {
      updatePreview({ x, y });

      store.dispatch(
        actions.dragMove({
          x, y, setValidMove, ...other,
        }),
      );
    };

    const onDragEnd = (movement) => {
      cleanupPreview();
      setIsDragging(false);

      store.dispatch(
        actions.dragEnd(movement),
      );
    };

    useEffect(() => {
      if (!node.current || !allowDrag) { return false; }

      dragManager = new DragManager({
        el: node.current,
        onDragStart,
        onDragMove,
        onDragEnd,
        scrollDirection,
      });

      return () => {
        cleanupPreview();
        cleanupDragManager();
      };
    }, [node]);

    const styles = () => (isDragging ? { visibility: 'hidden' } : {});

    return (
      <div style={styles()} className="draggable" ref={node}>
        <WrappedComponent {...rest} />
      </div>
    );
  };

export default dragSource;
