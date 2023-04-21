import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { deleteTask, runTask, runProject } from '../../Store/Actions/Task';

const Task = ({project, isRunning, isFinished, deleteTask, runTask, runProject}) => {
  const navigate = useNavigate();

  const TaskTable = (
    <table className="table table-info table-striped mt-4">
      <thead>
        <tr className="table-primary">
          <th>Task Name</th>
          <th>Type</th>
          <th>Action</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {project.tasks.map((task, index) => (
          <tr key={index}>
            <td>{task.name} ({task.sheet})</td>
            <td>{task.type}</td>
            <td>
              <button className="btn btn-success btn-sm" onClick={() => runTask(project.doc, task.sheet, task.type)}>Run</button>
            </td>
            <td>
              <button className="btn btn-danger btn-sm" onClick={() => {deleteTask(project.index, index); navigate('/task')}}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const Spinner = (
    <span>
      <span className='spinner-border text-danger text-center'></span>
      <p className='h4'>Running...</p>
    </span>
  );

  const Finished = (
    <div>
      <span><i class="fa-solid fa-check"></i></span>
      <p className='h4'>Finished</p>
    </div>
  );

  return (
    <div>
      <div className="container">
        {isRunning && Spinner}
        {isFinished && Finished}
        
        <div className="Task-panel mt-5 p-5" style={{borderRadius: '3px', border: '1px solid #333'}}>
          <h2>{project.name}</h2>

          <button className="btn btn-primary btn-lg" style={{float: 'right'}} 
            onClick={() => runProject(project.doc, project.tasks)}
          >
            Run Project
          </button>

          <Link to={"/create_task"}>
            <button className="btn btn-primary btn-lg mt-3">+ Create Task</button>
          </Link>          

          {TaskTable}
        </div>
      </div>
    </div>
  );
};

Task.propTypes = {
  project: PropTypes.object,
  isRunning: PropTypes.bool,
  deleteTask: PropTypes.func.isRequired,
  runTask: PropTypes.func.isRequired,
  runProject: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => ({
  project: state.projects.project,
  isRunning: state.projects.isRunning,
  isFinished: state.projects.isFinished
});

export default connect(mapStateToProps, { deleteTask, runTask, runProject })(Task);