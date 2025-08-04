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
  condition?: string;
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
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const creatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAvailableModules();

    // Check if editing existing project
    const editProjectId = searchParams.get('edit');
    if (editProjectId) {
      loadProjectForEdit(editProjectId);
    }
  }, [searchParams]);

  const loadAvailableModules = async () => {
    try {
      const response = await axios.get("/modules");
      setAvailableModules(response.data);
    } catch (error) {
      console.error("Error loading modules:", error);
    }
  };

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
    setShowAddModuleModal(false);
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
      isAutoSave: false,
      allowDefaultToolboxItems: false
    });

    // Add custom question button
    creatorInstance.toolbox.addItem({
      name: "custom-question",
      title: "Add Question",
      iconName: "icon-add",
      json: {
        type: "custom-question",
        name: "custom-question"
      },
      action: () => {
        const survey = creatorInstance.survey;
        let currentPage = survey.currentPage;
        
        if (!currentPage && survey.pages.length > 0) {
          currentPage = survey.pages[0];
        }
        
        if (currentPage) {
          setAddQuestionContext({
            page: currentPage,
            index: currentPage.elements.length
          });
          setShowPopup(true);
        }
      }
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

    // Update the selectedModules state with the condition
    setSelectedModules(prev =>
      prev.map(m => m.id === editingModuleId ? { ...m, condition } : m)
    );

    setShowConditionBuilder(false);
  };

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
          surveyJson: m.surveyJson,
          condition: m.condition
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
    <div className="p-6 flex flex-col gap-4 relative bg-gray-50 min-h-screen">
      {/* Project Name + Save */}
      <div className="enhanced-card">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              id="project-name"
              className="form-input"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveProject}
              className="enhanced-button primary"
            >
              {searchParams.get('edit') ? 'Update Project' : 'Save Project'}
            </button>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div className="enhanced-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Modules in this project</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCreateNewModule}
              className="enhanced-button success"
            >
              ➕ New Module
            </button>
            <button
              onClick={() => setShowAddModuleModal(true)}
              className="enhanced-button primary"
            >
              ➕ Add Existing Module
            </button>
          </div>
        </div>

        {selectedModules.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No modules added yet</h3>
            <p className="text-gray-500 mb-4">Add modules to your project to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedModules.map((mod) => (
              <div
                key={mod.id}
                className="p-4 bg-gray-50 border rounded-lg flex justify-between items-center"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{mod.name}</h3>
                  <p className="text-sm text-gray-500">
                    {mod.surveyJson?.pages?.[0]?.elements?.length || 0} questions
                  </p>
                  {mod.condition && (
                    <p className="text-xs text-blue-600 mt-1">
                      Condition: {mod.condition}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditModule(mod.id)}
                    className="enhanced-button primary"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setSelectedModules(prev => prev.filter(m => m.id !== mod.id))}
                    className="enhanced-button secondary"
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
          className="enhanced-card"
          style={{ height: "75vh" }}
        >
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">
              Editing: {selectedModules.find(m => m.id === editingModuleId)?.name}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConditionBuilder(true)}
                className="enhanced-button purple"
              >
                Add Conditions
              </button>
              <button
                onClick={() => {
                  setEditingModuleId(null);
                  setCreator(null);
                }}
                className="enhanced-button secondary"
              >
                ✖ Close
              </button>
            </div>
          </div>
          <SurveyCreatorComponent creator={creator} />
        </div>
      )}

      {/* Module Selection Modal */}
      {showAddModuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-auto relative">
            <h2 className="text-xl font-bold mb-4">Select a Module to Add</h2>
            <button
              onClick={() => setShowAddModuleModal(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
            {availableModules.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No modules available</h3>
                <p className="text-gray-500 mb-4">Create some modules first</p>
                <button
                  onClick={() => {
                    setShowAddModuleModal(false);
                    handleCreateNewModule();
                  }}
                  className="enhanced-button primary"
                >
                  Create Module
                </button>
              </div>
            ) : (
              availableModules.map((mod) => (
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
                    onClick={() => handleAddModule(mod)}
                    className="enhanced-button primary"
                  >
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Custom Question Popup */}
      {showPopup && (
        <div className="custom-popup-overlay">
          <div className="custom-popup-content">
            <h3 className="custom-popup-title">
              Choose Question Type
            </h3>
            <p className="custom-popup-subtitle">
              Select the type of question you want to add
            </p>
            
            <div className="custom-popup-buttons">
              <button
                onClick={() => addQuestion("checkbox")}
                className="custom-popup-button blue"
              >
                <div className="question-icon checkbox"></div>
                <div className="text-left">
                  <div className="font-semibold">Multiple Choice</div>
                  <div className="text-sm opacity-90">Allow multiple selections</div>
                </div>
              </button>
              
              <button
                onClick={() => addQuestion("radiogroup")}
                className="custom-popup-button green"
              >
                <div className="question-icon radio"></div>
                <div className="text-left">
                  <div className="font-semibold">Single Choice</div>
                  <div className="text-sm opacity-90">Allow only one selection</div>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => {
                setShowPopup(false);
                setAddQuestionContext(null);
              }}
              className="custom-popup-cancel"
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