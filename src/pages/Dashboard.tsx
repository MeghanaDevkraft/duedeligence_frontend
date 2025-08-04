import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  modules: { module: { id: string; name: string } }[];
}

interface Module {
  id: string;
  name: string;
  surveyJson: any;
  condition?: string;
}

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showModuleView, setShowModuleView] = useState(false);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsRes, modulesRes] = await Promise.all([
        axios.get("/projects"),
        axios.get("/modules")
      ]);

      // Handle projects response
      if (Array.isArray(projectsRes.data)) {
        setProjects(projectsRes.data);
      } else if (Array.isArray(projectsRes.data.projects)) {
        setProjects(projectsRes.data.projects);
      }

      // Handle modules response
      if (Array.isArray(modulesRes.data)) {
        setModules(modulesRes.data);
      } else if (Array.isArray(modulesRes.data.modules)) {
        setModules(modulesRes.data.modules);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewModule = (module: Module) => {
    setSelectedModule(module);
    setShowModuleView(true);
  };

  const ModuleView = ({ module, onClose }: { module: Module; onClose: () => void }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{module.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light transition-colors duration-200"
            >
              ×
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
            <div className="space-y-6">
              {module.condition && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Module Condition</h4>
                  <p className="text-blue-800 text-sm">{module.condition}</p>
                </div>
              )}
              
              <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
              {module.surveyJson && module.surveyJson.pages ? (
                module.surveyJson.pages.map((page: any, pageIndex: number) => (
                  <div key={pageIndex} className="space-y-4">
                    <h4 className="font-medium text-gray-800 text-lg">Page {pageIndex + 1}</h4>
                    {page.elements && page.elements.map((element: any, elementIndex: number) => (
                      <div key={elementIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-500">Q{elementIndex + 1}</span>
                              <div className="font-medium text-gray-900">
                                {element.title || `Question ${elementIndex + 1}`}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-3">
                              Type: <span className="font-medium">{element.type || 'Unknown'}</span>
                            </div>
                            {element.choices && (
                              <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">Options:</div>
                                <ul className="space-y-1">
                                  {element.choices.map((choice: any, choiceIndex: number) => (
                                    <li key={choiceIndex} className="text-sm text-gray-600 flex items-center">
                                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                                      {typeof choice === 'string' ? choice : choice.text || choice.value || 'Unknown option'}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {element.isRequired && (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Required
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {element.type || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">❓</div>
                  <div className="text-gray-500">No questions found in this module.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Dashboard</h1>
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Projects</h2>
            <button 
              onClick={() => nav("/create-project")} 
              className="enhanced-button primary"
            >
              ➕ Create Project
            </button>
          </div>
          <div className="grid gap-4">
            {projects.map(p => (
              <div key={p.id} className="enhanced-card">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">{p.name}</h3>
                    <p className="text-sm text-gray-500">
                      {p.modules.length} modules
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => nav(`/project-view/${p.id}`)}
                      className="enhanced-button primary"
                    >
                      View & Answer
                    </button>
                    <button 
                      onClick={() => nav(`/project-answers/${p.id}`)}
                      className="enhanced-button success"
                    >
                      View Answers
                    </button>
                    <button 
                      onClick={() => nav(`/create-project?edit=${p.id}`)}
                      className="enhanced-button secondary"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="enhanced-card text-center">
                <div className="text-gray-400 text-6xl mb-4">📁</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-500 mb-4">Create your first project to get started</p>
                <button 
                  onClick={() => nav("/create-project")}
                  className="enhanced-button primary"
                >
                  Create Project
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Independent Modules</h2>
            <button 
              onClick={() => nav("/create-module")} 
              className="enhanced-button success"
            >
              ➕ New Module
            </button>
          </div>
          <div className="grid gap-4">
            {modules.map(m => (
              <div key={m.id} className="enhanced-card hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">{m.name}</h3>
                    <p className="text-sm text-gray-500">
                      {m.surveyJson?.pages?.[0]?.elements?.length || 0} questions
                    </p>
                    {m.condition && (
                      <p className="text-xs text-blue-600 mt-1">
                        Has condition: {m.condition}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleViewModule(m)}
                      className="enhanced-button primary"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => nav(`/create-module/${m.id}`)}
                      className="enhanced-button secondary"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {modules.length === 0 && (
              <div className="enhanced-card text-center">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
                <p className="text-gray-500 mb-4">Create your first module to get started</p>
                <button 
                  onClick={() => nav("/create-module")}
                  className="enhanced-button primary"
                >
                  Create Module
                </button>
              </div>
            )}
          </div>
        </div>

        {showModuleView && selectedModule && (
          <ModuleView module={selectedModule} onClose={() => setShowModuleView(false)} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
