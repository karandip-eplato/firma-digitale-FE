import { combineReducers } from 'redux';
import NoOfDocuments from './NoOfDocuments';
import DocumentIndex from './DocumentIndex';
import SignatureIndex from './SignatureIndex';
import Output from './Output';
import ShowAppbar from './ShowAppbar';
import ZoomValue from './ZoomValue';
export default combineReducers({
  NoOfDocuments,
  DocumentIndex,
  SignatureIndex,
  Output,
  ShowAppbar,
  ZoomValue
});
