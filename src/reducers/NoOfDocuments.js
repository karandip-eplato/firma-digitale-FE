import { SET_NUMBER_OF_DOCUMENTS } from "../actions";

const noOfDocuments = (state = 1, action) => {
    switch (action.type) {
        case SET_NUMBER_OF_DOCUMENTS:
            return action.number;
        default:
            return state;
    }
}
export default noOfDocuments;