import React, { useState } from 'react';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { addProject } from '../../Store/Actions/Project';

const CreateProject = ({addProject}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectName: '',
    googledoc: ''
  });

  const onSaveProject = (e) => {
    if(formData.googledoc !== '' & formData.projectName !== '') {
      addProject(formData.projectName, formData.googledoc);

      navigate('/');
    }    
  }

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  return (
    <div className='container' style={{width: '50%'}}>
      <div className='mt-5'>
        <h1 className='text-center'>Create Project</h1>

        <div className="form-group">
          <p className='lead'>Project Name:</p>
          <input type="text" className='form-control' name='projectName' value={formData.projectName} onChange={onChange} required/>
          <br />
        </div>

        <div className="form-group">
          <p className='lead'>Google Doc:</p>
          <input type="text" className='form-control' name='googledoc' value={formData.googledoc} onChange={onChange} required/>
          <br />
        </div>

        <button type='button' className='btn btn-lg btn-success mt-3' onClick={onSaveProject}>Save</button>
      </div>
    </div>
  );
}

export default connect(null, {addProject})(CreateProject);