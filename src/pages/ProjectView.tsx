import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";

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

const ProjectView = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [survey, setSurvey] = useState<Model | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [visibleModules, setVisibleModules] = useState<string[]>([]);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
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
      // Initially show all modules
      setVisibleModules(response.data.modules.map((m: any) => m.module.id));
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

  const handleModuleSelect = (moduleId: string) => {
    setSelectedModule(moduleId);
    const module = project?.modules.find(m => m.module.id === moduleId);
    if (module) {
      const surveyModel = new Model(module.module.surveyJson);
      
      // Add custom condition evaluator
      surveyModel.onValueChanged.add((_sender, options) => {
        handleAnswerChange(options.name, options.value);
        evaluateConditions();
      });

      // Add custom visibility logic
      surveyModel.onAfterRenderQuestion.add((_sender, options) => {
        const question = options.question;
        if (question.visibleIf) {
          const isVisible = evaluateCustomCondition(question.visibleIf);
          question.visible = isVisible;
        }
      });

      setSurvey(surveyModel);
    }
  };

  const handleAnswerChange = async (questionId: string, value: any) => {
    if (!selectedModule) return;

    try {
      const answerValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      // Update local state
      setAnswers(prev => {
        const existing = prev.find(a => a.questionId === questionId && a.moduleId === selectedModule);
        if (existing) {
          return prev.map(a => 
            a.id === existing.id ? { ...a, answerValue } : a
          );
        } else {
          return [...prev, {
            id: `temp_${Date.now()}`,
            questionId,
            answerValue,
            moduleId: selectedModule
          }];
        }
      });

      // Save to backend
      await axios.post(`/responses/${projectId}`, {
        questionId,
        answerValue,
        moduleId: selectedModule
      });
    } catch (error) {
      console.error("Error saving answer:", error);
    }
  };

  const evaluateCustomCondition = (condition: string): boolean => {
    // Parse custom condition format: "moduleId:questionId:operator:value"
    const parts = condition.split(':');
    if (parts.length !== 4) return true;

    const [targetModuleId, targetQuestionId, operator, expectedValue] = parts;
    
    // Find the answer for the target question
    const answer = answers.find(a => 
      a.moduleId === targetModuleId && a.questionId === targetQuestionId
    );

    if (!answer) return false;

    const actualValue = answer.answerValue;

    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'not_equals':
        return actualValue !== expectedValue;
      case 'contains':
        return actualValue.includes(expectedValue);
      case 'greater_than':
        return parseFloat(actualValue) > parseFloat(expectedValue);
      case 'less_than':
        return parseFloat(actualValue) < parseFloat(expectedValue);
      case 'yes':
        return actualValue.toLowerCase() === 'yes' || actualValue === 'true';
      case 'no':
        return actualValue.toLowerCase() === 'no' || actualValue === 'false';
      default:
        return true;
    }
  };

  const evaluateConditions = () => {
    if (!project) return;

    const newVisibleModules = project.modules.filter(moduleData => {
      const module = moduleData.module;
      
      // Check if module has visibility conditions
      if (module.surveyJson?.pages?.[0]?.elements) {
        const hasConditions = module.surveyJson.pages[0].elements.some((element: any) => 
          element.visibleIf || element.condition
        );
        
        if (hasConditions) {
          // Evaluate conditions for this module
          return module.surveyJson.pages[0].elements.every((element: any) => {
            if (element.visibleIf) {
              return evaluateCustomCondition(element.visibleIf);
            }
            return true;
          });
        }
      }
      
      return true;
    }).map(m => m.module.id);

    setVisibleModules(newVisibleModules);
  };

  const markModuleComplete = (moduleId: string) => {
    setCompletedModules(prev => [...prev, moduleId]);
  };

  const viewAnswers = () => {
    navigate(`/project-answers/${projectId}`);
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading project...</div>
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
              <p className="text-gray-600 mt-2">Complete the due diligence survey</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={viewAnswers}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                View Answers
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Modules List */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Modules</h2>
              <div className="space-y-3">
                {project.modules.map((moduleData) => {
                  const module = moduleData.module;
                  const isVisible = visibleModules.includes(module.id);
                  const isCompleted = completedModules.includes(module.id);
                  const isSelected = selectedModule === module.id;

                  if (!isVisible) return null;

                  return (
                    <div
                      key={module.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : isCompleted
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() => handleModuleSelect(module.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{module.name}</h3>
                          <p className="text-sm text-gray-500">
                            {module.surveyJson?.pages?.[0]?.elements?.length || 0} questions
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCompleted && (
                            <span className="text-green-600">✓</span>
                          )}
                          {isSelected && (
                            <span className="text-blue-600">→</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Survey Area */}
          <div className="lg:col-span-2">
            {selectedModule && survey ? (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {project.modules.find(m => m.module.id === selectedModule)?.module.name}
                  </h2>
                </div>
                                 <div className="survey-container">
                   <Survey model={survey} />
                 </div>
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => markModuleComplete(selectedModule)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    Mark Complete
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Module</h3>
                <p className="text-gray-500">
                  Choose a module from the list to start answering questions
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectView; 