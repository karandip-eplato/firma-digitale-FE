import { SET_DOCUMENT_INDEX } from "../actions";

const documentIndex = (state = 0, action) => {
    switch (action.type) {
        case SET_DOCUMENT_INDEX:
            return action.index;
        default:
            return state;
    }
}
export default documentIndex;