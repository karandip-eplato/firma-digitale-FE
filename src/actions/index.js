export const SET_DOCUMENT_INDEX = "SET_DOCUMENT_INDEX";
export const SET_SIGNATURE_INDEX = "SET_SIGNATURE_INDEX";
export const SET_NUMBER_OF_DOCUMENTS = "SET_NUMBER_OF_DOCUMENTS";
export const ADD_OUTPUT = "ADD_OUTPUT";
export const SHOW_APPBAR = "SHOW_APPBAR";
export const SET_ZOOM = "SET_ZOOM";
export const setZoom = zoomValue => {
  return {
    type: SET_ZOOM,
    zoomValue
  };
};
export const showAppbar = value => {
  return {
    type: SHOW_APPBAR,
    value
  };
};
export const setDocumentIndex = index => {
  return {
    type: SET_DOCUMENT_INDEX,
    index
  };
};
export const setSignatureIndex = index => {
  return {
    type: SET_SIGNATURE_INDEX,
    index
  };
};
export const setOutput = (output, index) => {
  return {
    type: ADD_OUTPUT,
    output,
    index
  };
};
export const setNumberOfDocuments = number => {
  return {
    type: SET_NUMBER_OF_DOCUMENTS,
    number
  };
};
