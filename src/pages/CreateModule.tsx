import { useEffect, useState, useRef } from "react";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";
import { registerCreatorTheme } from "survey-creator-core";
import SurveyCreatorTheme from "survey-creator-core/themes";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { QuestionFactory, PageModel } from "survey-core";
import ConditionBuilder from "../components/ConditionBuilder";

registerCreatorTheme(SurveyCreatorTheme);

const CreateModule = () => {
  const [creator, setCreator] = useState<SurveyCreator | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [name, setName] = useState("");
  const [addQuestionContext, setAddQuestionContext] = useState<{
    page: PageModel;
    index: number;
  } | null>(null);
  const [availableModules, setAvailableModules] = useState<Array<{id: string, name: string, surveyJson: any}>>([]);
  const [moduleCondition, setModuleCondition] = useState<string>("");
  const [showConditionBuilder, setShowConditionBuilder] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const creatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAvailableModules();
  }, []);

  const loadAvailableModules = async () => {
    try {
      const response = await axios.get("/modules");
      setAvailableModules(response.data);
    } catch (error) {
      console.error("Error loading modules:", error);
    }
  };

  useEffect(() => {
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

    // Override the default add question functionality
    const originalAddQuestion = creatorInstance.toolbox.addItem;
    creatorInstance.toolbox.addItem = function(item: any) {
      if (item.name === "question" || item.name === "checkbox" || item.name === "radiogroup") {
        // Intercept the add question action
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
          return; // Don't add the question immediately
        }
      }
      // Call original function for other items
      return originalAddQuestion.call(this, item);
    };

    // Load existing survey if editing
    if (id) {
      axios.get(`/modules/${id}`).then((res) => {
        console.log("Loading existing module:", res.data);
        setName(res.data.name || "");
        setModuleCondition(res.data.condition || "");
        if (res.data.surveyJson) {
          creatorInstance.JSON = res.data.surveyJson;
        } else {
          creatorInstance.JSON = {
            pages: [{
              name: "page1",
              elements: []
            }]
          };
        }
      }).catch((error) => {
        console.error("Error loading module:", error);
        creatorInstance.JSON = {
          pages: [{
            name: "page1",
            elements: []
          }]
        };
      });
    } else {
      creatorInstance.JSON = {
        pages: [{
          name: "page1",
          elements: []
        }]
      };
    }

    setCreator(creatorInstance);

    return () => {
      // Cleanup
    };
  }, [id]);

  // Add event listeners to intercept SurveyJS add question buttons
  useEffect(() => {
    if (!creator) return;

    const handleAddQuestionClick = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Check if this is a SurveyJS add question button
      const isAddQuestionButton = 
        target.closest('[data-sv-creator-toolbox-item="question"]') ||
        target.closest('.svc-toolbox__item--question') ||
        target.closest('[data-sv-creator-add-question]') ||
        target.closest('.svc-add-new-question') ||
        target.closest('.svc-add-question') ||
        target.closest('button[title*="Add Question"]') ||
        target.closest('button[aria-label*="Add Question"]') ||
        target.closest('.svc-add-new-item-button__text') ||
        (target.closest('[data-sv-creator-toolbox-item]') && target.textContent?.includes('Question')) ||
        (target.closest('.svc-toolbox__item') && target.textContent?.includes('Question')) ||
        (target.closest('.svc-toolbox__item') && target.textContent?.includes('Add'));

      if (isAddQuestionButton) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        const survey = creator.survey;
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
        
        return false;
      }
    };

    // Use MutationObserver to catch dynamically added SurveyJS elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Look for SurveyJS add question buttons
            const addQuestionButtons = element.querySelectorAll(
              '[data-sv-creator-toolbox-item="question"], .svc-toolbox__item--question, [data-sv-creator-add-question], .svc-add-new-question, .svc-add-question, button[title*="Add Question"], button[aria-label*="Add Question"], .svc-add-new-item-button__text'
            );
            
            addQuestionButtons.forEach(button => {
              button.addEventListener('click', handleAddQuestionClick);
            });
          }
        });
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Add global event listener
    document.addEventListener('click', handleAddQuestionClick, true);

    return () => {
      document.removeEventListener('click', handleAddQuestionClick, true);
      observer.disconnect();
    };
  }, [creator]);

  const addQuestion = (type: "checkbox" | "radiogroup") => {
    if (!creator || !addQuestionContext) {
      console.error("Cannot add question: creator or context not available");
      return;
    }

    try {
      console.log("Adding question of type:", type);
      
      const questionName = `question_${Date.now()}`;
      const newQuestion = QuestionFactory.Instance.createQuestion(type, questionName);
      
      newQuestion.title = type === "checkbox" ? "Multiple Choice Question" : "Single Choice Question";
      newQuestion.choices = ["Option 1", "Option 2", "Option 3"];
      newQuestion.isRequired = true;

      console.log("Created question:", newQuestion);

      addQuestionContext.page.addElement(newQuestion, addQuestionContext.index);

      console.log("Question added successfully");
      console.log("Current survey JSON:", creator.JSON);

      setAddQuestionContext(null);
      setShowPopup(false);
    } catch (error) {
      console.error("Error adding question:", error);
      alert("Failed to add question. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Module name is required");
      return;
    }
    if (!creator) {
      alert("Survey creator not initialized");
      return;
    }

    const surveyJson = creator.JSON;
    console.log("Saving module:", { name, surveyJson, moduleCondition });

    try {
      if (id) {
        const response = await axios.put(`/modules/${id}`, { 
          name, 
          surveyJson,
          condition: moduleCondition
        });
        console.log("Module updated successfully:", response.data);
        alert("Module updated successfully!");
      } else {
        const response = await axios.post("/modules", { 
          name, 
          surveyJson,
          condition: moduleCondition
        });
        console.log("Module created successfully:", response.data);
        alert("Module created successfully!");
        navigate(`/create-module/${response.data.id}`);
      }
    } catch (err: any) {
      console.error("Save failed:", err);
      console.error("Error details:", err.response?.data || err.message);
      alert(`Save failed: ${err.response?.data?.error || err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4 relative bg-gray-50 min-h-screen">
      {/* Module Name + Save */}
      <div className="enhanced-card">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <label htmlFor="module-name" className="block text-sm font-medium text-gray-700 mb-2">
              Module Name
            </label>
            <input
              id="module-name"
              className="form-input"
              placeholder="Enter module name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConditionBuilder(true)}
              className="enhanced-button purple"
            >
              Module Conditions
            </button>
            <button
              onClick={handleSave}
              className="enhanced-button primary"
            >
              Save Module
            </button>
          </div>
        </div>
      </div>

      {/* Module Condition Display */}
      {moduleCondition && (
        <div className="module-condition">
          <h4>Module Visibility Condition</h4>
          <p>{moduleCondition}</p>
        </div>
      )}

      {/* SurveyJS Canvas */}
      <div
        ref={creatorRef}
        className="enhanced-card"
        style={{
          height: "75vh",
        }}
      >
        {creator && <SurveyCreatorComponent creator={creator} />}
      </div>

      {/* Custom Popup for Adding Question */}
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

      {/* Condition Builder Modal */}
      <ConditionBuilder
        modules={availableModules}
        onConditionChange={setModuleCondition}
        currentCondition={moduleCondition}
        isOpen={showConditionBuilder}
        onClose={() => setShowConditionBuilder(false)}
      />
    </div>
  );
};

export default CreateModule;