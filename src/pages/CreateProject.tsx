import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import { QuestionFactory, PageModel } from "survey-core";
import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";
import { registerCreatorTheme } from "survey-creator-core";
import SurveyCreatorTheme from "survey-creator-core/themes";
import ConditionBuilder from "../components/ConditionBuilder";

registerCreatorTheme(SurveyCreatorTheme);

interface Module {
  id: string;
  name: string;
  surveyJson: any;
}

const CreateProject = () => {
  const [projectName, setProjectName] = useState("");
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<Module[]>([]);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [creator, setCreator] = useState<SurveyCreator | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showConditionBuilder, setShowConditionBuilder] = useState(false);
  const [addQuestionContext, setAddQuestionContext] = useState<{
    page: PageModel;
    index: number;
  } | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const creatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios.get("/modules").then((res) => {
      setAvailableModules(res.data);
    });

    // Check if editing existing project
    const editProjectId = searchParams.get('edit');
    if (editProjectId) {
      loadProjectForEdit(editProjectId);
    }
  }, [searchParams]);

  const loadProjectForEdit = async (projectId: string) => {
    try {
      const response = await axios.get(`/projects/${projectId}`);
      const project = response.data;
      setProjectName(project.name);
      setSelectedModules(project.modules.map((m: any) => m.module));
    } catch (error) {
      console.error("Error loading project for edit:", error);
    }
  };

  const handleAddModule = (mod: Module) => {
    if (selectedModules.find((m) => m.id === mod.id)) return;
    const copiedSurvey = JSON.parse(JSON.stringify(mod.surveyJson));
    setSelectedModules([...selectedModules, { ...mod, surveyJson: copiedSurvey }]);
  };

  const handleEditModule = (modId: string) => {
    const mod = selectedModules.find((m) => m.id === modId);
    if (!mod) return;

    const creatorInstance = new SurveyCreator({
      showLogicTab: true,
      showThemeTab: false,
      showJSONEditorTab: false,
      showTranslationTab: false,
      showPagesToolbox: false,
      showHeader: false,
      showToolbox: true,
      isAutoSave: false
    });

    creatorInstance.JSON = mod.surveyJson || {
      pages: [{
        name: "page1",
        elements: []
      }]
    };

    setCreator(creatorInstance);
    setEditingModuleId(modId);
  };

  const handleCreateNewModule = () => {
    navigate("/create-module");
  };

  const handleConditionSave = (condition: string) => {
    if (!creator || !editingModuleId) return;

    // Add condition to the current module's survey
    const currentSurvey = creator.JSON;
    if (currentSurvey.pages && currentSurvey.pages[0] && currentSurvey.pages[0].elements) {
      // Add condition to the first element or create a condition field
      if (currentSurvey.pages[0].elements.length > 0) {
        currentSurvey.pages[0].elements[0].visibleIf = condition;
      }
    }

    // Update the selectedModules state with the modified survey
    setSelectedModules(prev =>
      prev.map(m => m.id === editingModuleId ? { ...m, surveyJson: currentSurvey } : m)
    );

    setShowConditionBuilder(false);
  };

  // Add event listeners after the creator is mounted
  useEffect(() => {
    if (!creator) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check for various SurveyJS "Add Question" buttons
      const isAddQuestionButton = 
        target.closest('[data-sv-creator-toolbox-item]') ||
        target.closest('.svc-toolbox__item') ||
        target.closest('[data-sv-creator-add-question]') ||
        target.closest('.svc-add-new-question') ||
        target.closest('.svc-add-question') ||
        target.closest('[title*="Add Question"]') ||
        target.closest('[aria-label*="Add Question"]') ||
        target.textContent?.includes('Add Question') ||
        target.textContent?.includes('+') ||
        target.textContent?.includes('Add') ||
        target.closest('button[title*="question"]') ||
        target.closest('button[aria-label*="question"]') ||
        target.closest('.svc-toolbox__item--question') ||
        target.closest('[data-sv-creator-toolbox-item="question"]') ||
        target.closest('.svc-add-new-item-button__text');

      if (isAddQuestionButton) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        const survey = creator.survey;
        let currentPage = survey.currentPage;
        
        if (!currentPage) {
          if (survey.pages.length > 0) {
            currentPage = survey.pages[0];
          } else {
            currentPage = survey.addNewPage("Page 1");
          }
        }
        
        if (currentPage) {
          setAddQuestionContext({
            page: currentPage,
            index: currentPage.elements.length
          });
          setShowPopup(true);
        }
        
        return false;
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      const isAddQuestionButton = 
        target.closest('[data-sv-creator-toolbox-item]') ||
        target.closest('.svc-toolbox__item') ||
        target.closest('[data-sv-creator-add-question]') ||
        target.closest('.svc-add-new-question') ||
        target.closest('.svc-add-question') ||
        target.closest('[title*="Add Question"]') ||
        target.closest('[aria-label*="Add Question"]') ||
        target.textContent?.includes('Add Question') ||
        target.textContent?.includes('+') ||
        target.textContent?.includes('Add') ||
        target.closest('button[title*="question"]') ||
        target.closest('button[aria-label*="question"]') ||
        target.closest('.svc-toolbox__item--question') ||
        target.closest('[data-sv-creator-toolbox-item="question"]') ||
        target.closest('.svc-add-new-item-button__text');

      if (isAddQuestionButton) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        const survey = creator.survey;
        let currentPage = survey.currentPage;
        
        if (!currentPage) {
          if (survey.pages.length > 0) {
            currentPage = survey.pages[0];
          } else {
            currentPage = survey.addNewPage("Page 1");
          }
        }
        
        if (currentPage) {
          setAddQuestionContext({
            page: currentPage,
            index: currentPage.elements.length
          });
          setShowPopup(true);
        }
        
        return false;
      }
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('mousedown', handleMouseDown, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [creator]);

  const addQuestion = (type: "checkbox" | "radiogroup") => {
    if (!creator || !addQuestionContext) return;

    try {
      const questionName = `question_${Date.now()}`;
      const newQuestion = QuestionFactory.Instance.createQuestion(type, questionName);
      
      newQuestion.title = type === "checkbox" ? "Multiple Choice Question" : "Single Choice Question";
      newQuestion.choices = ["Option 1", "Option 2", "Option 3"];
      newQuestion.isRequired = true;

      addQuestionContext.page.addElement(newQuestion, addQuestionContext.index);

      // Update the selectedModules state with the modified survey
      if (editingModuleId) {
        const updatedJson = creator.JSON;
        setSelectedModules(prev =>
          prev.map(m => m.id === editingModuleId ? { ...m, surveyJson: updatedJson } : m)
        );
      }

      setAddQuestionContext(null);
      setShowPopup(false);
    } catch (error) {
      console.error("Error adding question:", error);
      alert("Failed to add question. Please try again.");
    }
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      alert("Project name is required");
      return;
    }
    if (selectedModules.length === 0) {
      alert("Please add at least one module");
      return;
    }

    try {
      const editProjectId = searchParams.get('edit');
      const projectData = {
        name: projectName,
        modules: selectedModules.map(m => ({
          moduleId: m.id,
          surveyJson: m.surveyJson
        }))
      };

      if (editProjectId) {
        await axios.put(`/projects/${editProjectId}`, projectData);
        alert("Project updated successfully!");
      } else {
        await axios.post("/projects", projectData);
        alert("Project created successfully!");
      }
      
      navigate("/");
    } catch (err: any) {
      console.error("Save failed:", err);
      alert(`Save failed: ${err.response?.data?.error || err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4 relative">
      {/* Project Name + Save */}
      <div className="flex gap-4 items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex-1">
          <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-2">
            Project Name
          </label>
          <input
            id="project-name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 placeholder-gray-500"
            placeholder="Enter project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSaveProject}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
          >
            {searchParams.get('edit') ? 'Update Project' : 'Save Project'}
          </button>
        </div>
      </div>

      {/* Modules Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Modules in this project</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCreateNewModule}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              ➕ New Module
            </button>
            <button
              onClick={() => document.getElementById("addModuleModal")?.classList.remove("hidden")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              ➕ Add Existing Module
            </button>
          </div>
        </div>

        {selectedModules.length === 0 ? (
          <p className="text-gray-500">No modules added yet.</p>
        ) : (
          <div className="space-y-3">
            {selectedModules.map((mod) => (
              <div
                key={mod.id}
                className="p-4 bg-gray-50 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <h3 className="font-medium text-gray-800">{mod.name}</h3>
                  <p className="text-sm text-gray-500">
                    {mod.surveyJson?.pages?.[0]?.elements?.length || 0} questions
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditModule(mod.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setSelectedModules(prev => prev.filter(m => m.id !== mod.id))}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SurveyJS Editor for Editing Module */}
      {editingModuleId && creator && (
        <div
          ref={creatorRef}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          style={{ height: "75vh" }}
        >
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">
              Editing: {selectedModules.find(m => m.id === editingModuleId)?.name}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConditionBuilder(true)}
                className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
              >
                Add Conditions
              </button>
              <button
                onClick={() => {
                  setEditingModuleId(null);
                  setCreator(null);
                }}
                className="text-red-500 hover:text-red-700"
              >
                ✖ Close
              </button>
            </div>
          </div>
          <SurveyCreatorComponent creator={creator} />
        </div>
      )}

      {/* Module Selection Modal */}
      <div
        id="addModuleModal"
        className="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50"
      >
        <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-auto relative">
          <h2 className="text-xl font-bold mb-4">Select a Module to Add</h2>
          <button
            onClick={() => document.getElementById("addModuleModal")?.classList.add("hidden")}
            className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
          {availableModules.map((mod) => (
            <div
              key={mod.id}
              className="p-3 border-b flex justify-between items-center hover:bg-gray-50"
            >
              <div>
                <h4 className="font-medium">{mod.name}</h4>
                <p className="text-sm text-gray-500">
                  {mod.surveyJson?.pages?.[0]?.elements?.length || 0} questions
                </p>
              </div>
              <button
                onClick={() => {
                  handleAddModule(mod);
                  document.getElementById("addModuleModal")?.classList.add("hidden");
                }}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Question Popup */}
      {showPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxWidth: '400px',
            width: '100%',
            margin: '0 16px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '8px'
              }}>
                Choose Question Type
              </h3>
              <p style={{
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Select the type of question you want to add
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button
                onClick={() => addQuestion("checkbox")}
                style={{
                  width: '100%',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '16px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid white',
                  borderRadius: '4px'
                }}></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600' }}>Multiple Choice</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Allow multiple selections</div>
                </div>
              </button>
              
              <button
                onClick={() => addQuestion("radiogroup")}
                style={{
                  width: '100%',
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '16px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid white',
                  borderRadius: '50%'
                }}></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600' }}>Single Choice</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Allow only one selection</div>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => {
                setShowPopup(false);
                setAddQuestionContext(null);
              }}
              style={{
                marginTop: '24px',
                width: '100%',
                color: '#6b7280',
                fontSize: '14px',
                fontWeight: '500',
                padding: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Condition Builder */}
      {showConditionBuilder && editingModuleId && (
        <ConditionBuilder
          isOpen={showConditionBuilder}
          onClose={() => setShowConditionBuilder(false)}
          onSave={handleConditionSave}
          availableModules={selectedModules}
          currentModuleId={editingModuleId}
        />
      )}
    </div>
  );
};

export default CreateProject;