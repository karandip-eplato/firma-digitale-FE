import { SHOW_APPBAR } from "../actions";

const showAppbar = (state = 1, action) => {
  switch (action.type) {
    case SHOW_APPBAR:
      return action.value;
    default:
      return state;
  }
};
export default showAppbar;
