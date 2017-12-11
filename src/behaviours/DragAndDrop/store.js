import { filter, reject, omit, uniqBy, throttle } from 'lodash';
import { compose, createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from './reducer';

const store = createStore(
  reducer,
  applyMiddleware(thunk),
);

const logger = (store) => {
  console.log({
    ...store,
  });
};

store.subscribe(() => logger(store.getState()));

export default store;
