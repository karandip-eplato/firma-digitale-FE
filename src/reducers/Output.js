import { ADD_OUTPUT } from "../actions";

const output = (state = [], action) => {
  switch (action.type) {
    case ADD_OUTPUT:
      let output = [...state];
      output[action.index] = action.output;
      return output;
    default:
      return state;
  }
};
export default output;
