import React, { useState } from 'react';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { addTask } from '../../Store/Actions/Task';

const CreateTask = ({addTask, project}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    taskName: '',
    googlesheet: '',
    type: 'Build'
  });

  const onSaveProject = (e) => {
    if(formData.googlesheet !== '' & formData.projectName !== '') {
      addTask(project.index, formData.taskName, formData.googlesheet, formData.type);

      navigate('/task');
    }    
  }

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  return (
    <div className='container' style={{width: '50%'}}>
      <div className='mt-5'>
        <h1 className='text-center'>Create Task</h1>

        <div className="form-group">
          <p className='lead'>Task Name:</p>
          <input type="text" className='form-control' name='taskName' value={formData.taskName} onChange={onChange} required/>
          <br />
        </div>

        <div className="form-group">
          <p className='lead'>Google Sheet:</p>
          <input type="text" className='form-control' name='googlesheet' value={formData.googlesheet} onChange={onChange} required/>
          <br />
        </div>

        <div className="form-group">
          <p className='lead'>Type:</p>
          <select className='form-select' name='type' value={formData.type} onChange={onChange}>
            <option value="Build">Build</option>
            <option value="Fixed">Fixed</option>
            <option value="If, Then">If/then</option>
            <option value="Combo">Combo</option>
          </select>
          <br />
        </div>

        <button type='button' className='btn btn-lg btn-success mt-3' onClick={onSaveProject}>Save</button>
      </div>
    </div>
  );
}

const mapStateToProps = (state) => ({
  project: state.projects.project
});

export default connect(mapStateToProps, {addTask})(CreateTask);