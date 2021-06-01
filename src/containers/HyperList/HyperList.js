import React, {
  useContext,
  useMemo,
  useCallback,
} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { motion } from 'framer-motion';
import { VariableSizeGrid as Grid } from 'react-window';
import { compose, withProps } from 'recompose';
import cx from 'classnames';
import useGridSizer from './useGridSizer';
import { DragSource, DropTarget, MonitorDropTarget } from '../../behaviours/DragAndDrop';

const ListContext = React.createContext({ items: [], columns: 0 });

const variants = {
  visible: { scale: 1, opacity: 1, transition: { delay: 0.15 } },
  hidden: { scale: 0, opacity: 0.5, transition: { delay: 0.15 } },
};

const NoopComponent = () => null;

const getCellRenderer = (Component) => ({
  columnIndex,
  rowIndex,
  style,
}) => {
  const {
    items,
    columns,
    itemType,
    dynamicProperties,
  } = useContext(ListContext);
  const dataIndex = (rowIndex * columns) + columnIndex;
  const item = items[dataIndex];

  if (!item) { return null; }

  const { props, id, data } = item;
  const { selected } = dynamicProperties;

  const isSelected = selected.includes(id);

  return (
    <motion.div
      className="hyper-list__item"
      style={style}
      initial="hidden"
      animate="visible"
      variants={variants}
      key={id}
    >
      <Component
        {...props}
        meta={() => ({ data, id, itemType })}
        disabled={isSelected}
        allowDrag={!isSelected}
      />
    </motion.div>
  );
};

/**
  * HyperList
  */
const HyperList = ({
  className,
  items,
  dynamicProperties,
  itemComponent: ItemComponent,
  columns,
  itemType,
  emptyComponent: EmptyComponent,
  placeholder,
  willAccept,
  isOver,
}) => {
  const CellRenderer = useMemo(
    () => getCellRenderer(DragSource(ItemComponent)),
    [ItemComponent, columns],
  );

  const SizeRenderer = useCallback((props) => (
    <div className="hyper-list__item"><ItemComponent {...props} /></div>
  ), [ItemComponent]);

  const context = useMemo(() => ({
    items,
    columns,
    dynamicProperties,
    itemType,
  }), [items, columns, dynamicProperties, itemType]);

  const [gridProps, ready, setWidth] = useGridSizer(SizeRenderer, items, columns);

  const handleResize = useCallback(({ width }) => setWidth(width), [setWidth]);

  const classNames = cx(
    'hyper-list',
    className,
    { 'hyper-list--drag': willAccept },
    { 'hyper-list--hover': willAccept && isOver },
  );

  // If placeholder is provider it supercedes everything
  const showPlaceholder = !!placeholder;
  // If items is provided but is empty show the empty component
  const showEmpty = !placeholder && items && items.length === 0;
  // Otherwise show the results!
  const showResults = !placeholder && items && items.length > 0;

  return (
    <div className={classNames}>
      <ListContext.Provider value={context}>
        <div className="hyper-list__container">
          { showPlaceholder && placeholder }
          { showEmpty && <EmptyComponent />}
          <AutoSizer onResize={handleResize}>
            {({ width, height }) => {
              // If autosizer is not ready, items would
              // be sized incorrectly
              if (!ready) { return null; }

              if (!showResults) { return null; }

              return (
                <Grid
                  height={height}
                  width={width}
                  {...gridProps}
                >
                  {CellRenderer}
                </Grid>
              );
            }}
          </AutoSizer>
        </div>
      </ListContext.Provider>
    </div>
  );
};

HyperList.propTypes = {
};

HyperList.defaultProps = {
  itemComponent: NoopComponent,
  emptyComponent: NoopComponent,
  placeholder: NoopComponent,
  columns: 2,
  rowHeight: 300,
  itemType: 'HYPER_LIST',
};

export default compose(
  withProps(() => ({
    id: 'hyper-list',
  })),
  DropTarget,
  MonitorDropTarget(['isOver', 'willAccept']),
)(HyperList);
