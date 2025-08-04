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
      condition?: string;
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadAnswers();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/projects/${projectId}`);
      setProject(response.data);
      // Initially show all modules
      setVisibleModules(response.data.modules.map((m: any) => m.module.id));
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoading(false);
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

      // Pre-populate answers if they exist
      const moduleAnswers = answers.filter(a => a.moduleId === moduleId);
      moduleAnswers.forEach(answer => {
        try {
          const value = JSON.parse(answer.answerValue);
          surveyModel.setValue(answer.questionId, value);
        } catch {
          surveyModel.setValue(answer.questionId, answer.answerValue);
        }
      });

      setSurvey(surveyModel);
    }
  };

  const handleAnswerChange = async (questionId: string, value: any) => {
    if (!selectedModule) return;

    try {
      console.log("Saving answer:", { questionId, value, moduleId: selectedModule });
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
      const response = await axios.post(`/responses/single`, {
        projectId,
        questionId,
        answerValue,
        moduleId: selectedModule
      });
      
      console.log("Answer saved successfully:", response.data);
    } catch (error) {
      console.error("Error saving answer:", error);
      alert("Failed to save answer. Please try again.");
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
      
      // Check if module has a condition
      if (module.condition) {
        return evaluateCustomCondition(module.condition);
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

  const getModuleProgress = (moduleId: string) => {
    const moduleAnswers = answers.filter(a => a.moduleId === moduleId);
    const module = project?.modules.find(m => m.module.id === moduleId);
    const totalQuestions = module?.module.surveyJson?.pages?.[0]?.elements?.length || 0;
    return totalQuestions > 0 ? (moduleAnswers.length / totalQuestions) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Project not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="enhanced-card mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-2">Complete the due diligence survey</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={viewAnswers}
                className="enhanced-button success"
              >
                View Answers
              </button>
              <button
                onClick={() => navigate("/")}
                className="enhanced-button secondary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Modules List */}
          <div className="lg:col-span-1">
            <div className="enhanced-card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Modules</h2>
              <div className="space-y-3">
                {project.modules.map((moduleData) => {
                  const module = moduleData.module;
                  const isVisible = visibleModules.includes(module.id);
                  const isCompleted = completedModules.includes(module.id);
                  const isSelected = selectedModule === module.id;
                  const progress = getModuleProgress(module.id);

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
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{module.name}</h3>
                          <p className="text-sm text-gray-500">
                            {module.surveyJson?.pages?.[0]?.elements?.length || 0} questions
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCompleted && (
                            <span className="text-green-600 text-lg">✓</span>
                          )}
                          {isSelected && (
                            <span className="text-blue-600 text-lg">→</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(progress)}% complete
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
              <div className="enhanced-card">
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
                    className="enhanced-button success"
                  >
                    Mark Complete
                  </button>
                </div>
              </div>
            ) : (
              <div className="enhanced-card text-center">
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