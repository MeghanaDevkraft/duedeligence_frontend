// src/components/ProjectsList.tsx
import { Link } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  modules: { module: { id: string; name: string } }[];
}

interface ProjectsListProps {
  projects: Project[];
  onViewRules: (projectId: string) => void;
  onFillSurvey: (projectId: string) => void;
  onViewResults: (projectId: string) => void;
}

export function ProjectsList({ 
  projects, 
  onViewRules, 
  onFillSurvey, 
  onViewResults 
}: ProjectsListProps) {
  return (
    <div className="grid gap-4">
      {projects.map((project) => (
        <div key={project.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg mb-1">{project.name}</h3>
              <p className="text-sm text-gray-500">
                {project.modules.length} module{project.modules.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Link 
                to={`/projects/${project.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm"
              >
                View
              </Link>
              <Link
                to={`/projects/${project.id}/edit`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium text-sm"
              >
                Edit
              </Link>
              <button 
                onClick={() => onViewRules(project.id)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm"
              >
                Rules
              </button>
              <button 
                onClick={() => onFillSurvey(project.id)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm"
              >
                Fill Survey
              </button>
              <button 
                onClick={() => onViewResults(project.id)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm"
              >
                Results
              </button>
            </div>
          </div>
        </div>
      ))}
      {projects.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-gray-400 text-6xl mb-4">📂</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-4">Create your first project to get started</p>
          <Link
            to="/create-project"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium inline-block"
          >
            Create Project
          </Link>
        </div>
      )}
    </div>
  );
}