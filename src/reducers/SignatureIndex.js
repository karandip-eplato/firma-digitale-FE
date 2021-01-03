import { SET_SIGNATURE_INDEX } from "../actions";

const signatureIndex = (state = 0, action) => {
    switch (action.type) {
        case SET_SIGNATURE_INDEX:
            return action.index;
        default:
            return state;
    }
}
export default signatureIndex;