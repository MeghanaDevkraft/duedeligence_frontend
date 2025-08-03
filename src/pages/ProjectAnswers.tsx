import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

interface Project {
  id: string;
  name: string;
  modules: {
    module: {
      id: string;
      name: string;
      surveyJson: any;
    };
  }[];
}

interface Answer {
  id: string;
  questionId: string;
  answerValue: string;
  moduleId: string;
}

const ProjectAnswers = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadAnswers();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await axios.get(`/projects/${projectId}`);
      setProject(response.data);
      if (response.data.modules.length > 0) {
        setSelectedModule(response.data.modules[0].module.id);
      }
    } catch (error) {
      console.error("Error loading project:", error);
    }
  };

  const loadAnswers = async () => {
    try {
      const response = await axios.get(`/responses/${projectId}`);
      setAnswers(response.data);
    } catch (error) {
      console.error("Error loading answers:", error);
    }
  };

  const getQuestionText = (moduleId: string, questionId: string): string => {
    const module = project?.modules.find(m => m.module.id === moduleId);
    if (!module) return "Unknown Question";

    const question = module.module.surveyJson?.pages?.[0]?.elements?.find(
      (element: any) => element.name === questionId
    );

    return question?.title || question?.name || "Unknown Question";
  };

  const formatAnswerValue = (value: string): string => {
    try {
      // Try to parse as JSON (for array/object answers)
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.join(", ");
      }
      return String(parsed);
    } catch {
      // Return as is if not JSON
      return value;
    }
  };

  const getModuleAnswers = (moduleId: string) => {
    return answers.filter(answer => answer.moduleId === moduleId);
  };

  const exportAnswers = () => {
    if (!project) return;

    const exportData = {
      projectName: project.name,
      exportDate: new Date().toISOString(),
      modules: project.modules.map(moduleData => {
        const module = moduleData.module;
        const moduleAnswers = getModuleAnswers(module.id);
        
        return {
          moduleName: module.name,
          questions: moduleAnswers.map(answer => ({
            question: getQuestionText(module.id, answer.questionId),
            answer: formatAnswerValue(answer.answerValue)
          }))
        };
      })
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}_answers.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading project answers...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-2">Project Answers & Responses</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportAnswers}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Export Answers
              </button>
              <button
                onClick={() => navigate(`/project-view/${projectId}`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                Continue Survey
              </button>
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Modules Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Modules</h2>
              <div className="space-y-2">
                {project.modules.map((moduleData) => {
                  const module = moduleData.module;
                  const moduleAnswers = getModuleAnswers(module.id);
                  const isSelected = selectedModule === module.id;

                  return (
                    <div
                      key={module.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-100 border-blue-500 border-2'
                          : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedModule(module.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">{module.name}</h3>
                          <p className="text-xs text-gray-500">
                            {moduleAnswers.length} answers
                          </p>
                        </div>
                        {moduleAnswers.length > 0 && (
                          <span className="text-green-600 text-sm">✓</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Answers Display */}
          <div className="lg:col-span-3">
            {selectedModule ? (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {project.modules.find(m => m.module.id === selectedModule)?.module.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {getModuleAnswers(selectedModule).length} questions answered
                  </p>
                </div>

                {getModuleAnswers(selectedModule).length > 0 ? (
                  <div className="space-y-6">
                    {getModuleAnswers(selectedModule).map((answer) => (
                      <div
                        key={answer.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="mb-3">
                          <h3 className="font-medium text-gray-900">
                            {getQuestionText(selectedModule, answer.questionId)}
                          </h3>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-gray-700">
                            {formatAnswerValue(answer.answerValue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📝</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No answers yet</h3>
                    <p className="text-gray-500 mb-4">
                      This module hasn't been completed yet
                    </p>
                    <button
                      onClick={() => navigate(`/project-view/${projectId}`)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Start Survey
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Module</h3>
                <p className="text-gray-500">
                  Choose a module from the list to view its answers
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {project.modules.length}
              </div>
              <div className="text-sm text-blue-700">Total Modules</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {project.modules.filter(m => getModuleAnswers(m.module.id).length > 0).length}
              </div>
              <div className="text-sm text-green-700">Completed Modules</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {answers.length}
              </div>
              <div className="text-sm text-purple-700">Total Answers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnswers; 