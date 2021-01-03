import { SET_ZOOM } from "../actions";

const setZoom = (state = null, action) => {
  switch (action.type) {
    case SET_ZOOM:
      return action.zoomValue;
    default:
      return state;
  }
};
export default setZoom;
