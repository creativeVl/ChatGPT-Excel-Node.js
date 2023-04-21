import axios from "axios";

import { ADD_TASK, DELETE_TASK, FINISHED, RUNNING, SERVER_ERROR } from "./type";



export const addTask = (index, name, sheet, type) => (dispatch) => {
  dispatch({
    type: ADD_TASK,
    payload: {
      index,
      name,
      sheet,
      type
    }
  });
}

export const deleteTask = (projectIndex, taskIndex) => (dispatch) => {
  dispatch({
    type: DELETE_TASK,
    payload: {
      projectIndex,
      taskIndex
    }
  });
}

export const runTask = (doc, sheet, type) => async (dispatch) => {
  dispatch({
    type: RUNNING
  });

  try {
    const res = await axios.post('/run/task', {
      doc,
      sheet,
      type
    });
  
    dispatch({
      type: FINISHED
    });
  } catch (error) {
    alert('Server Error');
    dispatch({
      type: SERVER_ERROR
    });
  }
}

export const runProject = (doc, tasks) => async (dispatch) => {
  dispatch({
    type: RUNNING
  });

  try {
    const res = await axios.post('/run/project', {
      doc,
      tasks
    });

    dispatch({
      type: FINISHED
    });
  } catch (error) {
    alert('Server Error');
    dispatch({
      type: SERVER_ERROR
    });
  }

  
}
