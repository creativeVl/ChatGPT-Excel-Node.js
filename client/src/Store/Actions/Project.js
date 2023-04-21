import { ADD_PROJECT, DELETE_PROJECT, SELECT_PROJECT } from "./type";

export const addProject = (projectName, doc) => (dispatch) => {
  dispatch({
    type: ADD_PROJECT,
    payload: {
      name: projectName,
      doc: doc,
      tasks: []
    }
  });
}

export const deleteProject = (index) => (dispatch) => {
  dispatch({
    type: DELETE_PROJECT,
    payload: {
      index: index
    }
  });
}

export const selectProject = (index) => (dispatch) => {
  dispatch({
    type: SELECT_PROJECT,
    payload: {
      index: index
    }
  });
}