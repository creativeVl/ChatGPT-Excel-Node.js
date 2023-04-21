import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { deleteProject, selectProject } from '../../Store/Actions/Project';

const Project = ({projects, deleteProject, selectProject}) => {
  const navigate = useNavigate();

  const onSelectProject = (index) => {
    selectProject(index);

    navigate('/task');
  }

  const ProjectTable = (
    <table className="table table-info table-striped mt-4">
      <thead>
        <tr className="table-primary">
          <th>Project Name</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project, index) => (
          <tr key={index}>
            <td onClick={() => onSelectProject(index)}><Link> {project.name} ({project.doc}) </Link></td>
            <td>
              <button className="btn btn-danger btn-sm" onClick={() => deleteProject(index)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div>
      <div className="container">
        <div className="Project-panel mt-5 p-5" style={{borderRadius: '3px', border: '1px solid #333'}}>
          <Link to={"/create_project"}>
            <button className="btn btn-primary btn-lg">+ Create Project</button>
          </Link>
          {ProjectTable}          
        </div>
        
      </div>
    </div>
  );
};

Project.propTypes = {
  projects: PropTypes.array.isRequired,
  deleteProject: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({
  projects: state.projects.projects
});

export default connect(mapStateToProps, {deleteProject, selectProject})(Project);