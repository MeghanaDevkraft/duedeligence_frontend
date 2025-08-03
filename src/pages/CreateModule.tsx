import { useEffect, useState, useRef } from "react";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";
import { registerCreatorTheme } from "survey-creator-core";
import SurveyCreatorTheme from "survey-creator-core/themes";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { QuestionFactory, PageModel } from "survey-core";

registerCreatorTheme(SurveyCreatorTheme);

const CreateModule = () => {
  const [creator, setCreator] = useState<SurveyCreator | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [name, setName] = useState("");
  const [addQuestionContext, setAddQuestionContext] = useState<{
    page: PageModel;
    index: number;
  } | null>(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const creatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const creatorInstance = new SurveyCreator({
      showLogicTab: false,
      showThemeTab: false,
      showJSONEditorTab: false,
      showTranslationTab: false,
      showPagesToolbox: false,
      showHeader: false,
      showToolbox: false,
      isAutoSave: false
    });

    // Load existing survey if editing
    if (id) {
      axios.get(`/modules/${id}`).then((res) => {
        console.log("Loading existing module:", res.data);
        setName(res.data.name || "");
        if (res.data.surveyJson) {
          creatorInstance.JSON = res.data.surveyJson;
        } else {
          // Initialize with empty survey structure
          creatorInstance.JSON = {
            pages: [{
              name: "page1",
              elements: []
            }]
          };
        }
      }).catch((error) => {
        console.error("Error loading module:", error);
        // Initialize with empty survey structure if loading fails
        creatorInstance.JSON = {
          pages: [{
            name: "page1",
            elements: []
          }]
        };
      });
    } else {
      // Initialize with empty survey structure for new modules
      creatorInstance.JSON = {
        pages: [{
          name: "page1",
          elements: []
        }]
      };
    }

    setCreator(creatorInstance);

    return () => {
      // Cleanup if needed
    };
  }, [id]);

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
        console.log("Add question button clicked, preventing default behavior");
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Get the current page or create one if it doesn't exist
        const survey = creator.survey;
        let currentPage = survey.currentPage;
        
        // If no current page, get the first page or create one
        if (!currentPage) {
          if (survey.pages.length > 0) {
            currentPage = survey.pages[0];
          } else {
            // Create a new page if none exists
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
      
      // Also check for mousedown events on add question buttons
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
        console.log("Add question button mousedown, preventing default behavior");
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Get the current page or create one if it doesn't exist
        const survey = creator.survey;
        let currentPage = survey.currentPage;
        
        // If no current page, get the first page or create one
        if (!currentPage) {
          if (survey.pages.length > 0) {
            currentPage = survey.pages[0];
          } else {
            // Create a new page if none exists
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

    // Add event listeners with capture phase to intercept early
    document.addEventListener('click', handleClick, true);
    document.addEventListener('mousedown', handleMouseDown, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [creator]);

  const addQuestion = (type: "checkbox" | "radiogroup") => {
    if (!creator || !addQuestionContext) {
      console.error("Cannot add question: creator or context not available");
      return;
    }

    try {
      console.log("Adding question of type:", type);
      
      // Create a new question using QuestionFactory
      const questionName = `question_${Date.now()}`;
      const newQuestion = QuestionFactory.Instance.createQuestion(type, questionName);
      
      // Set the properties
      newQuestion.title = type === "checkbox" ? "Multiple Choice Question" : "Single Choice Question";
      newQuestion.choices = ["Option 1", "Option 2", "Option 3"];
      newQuestion.isRequired = true;

      console.log("Created question:", newQuestion);

      // Add to the page at the correct position
      addQuestionContext.page.addElement(newQuestion, addQuestionContext.index);

      console.log("Question added successfully");
      console.log("Current survey JSON:", creator.JSON);

      // Reset and close popup
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
    console.log("Saving module:", { name, surveyJson });

    try {
      if (id) {
        // Update existing module
        const response = await axios.put(`/modules/${id}`, { 
          name, 
          surveyJson 
        });
        console.log("Module updated successfully:", response.data);
        alert("Module updated successfully!");
      } else {
        // Create new module
        const response = await axios.post("/modules", { 
          name, 
          surveyJson 
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
    <div className="p-6 flex flex-col gap-4 relative">
      {/* Module Name + Save */}
      <div className="flex gap-4 items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex-1">
          <label htmlFor="module-name" className="block text-sm font-medium text-gray-700 mb-2">
            Module Name
          </label>
          <input
            id="module-name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 placeholder-gray-500"
            placeholder="Enter module name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
          >
            Save Module
          </button>
          <button
            onClick={async () => {
              try {
                const response = await axios.get("/modules");
                console.log("API test successful:", response.data);
                alert("API connection working!");
              } catch (err) {
                console.error("API test failed:", err);
                alert("API connection failed!");
              }
            }}
            className="px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
          >
            Test API
          </button>
        </div>
      </div>

      {/* SurveyJS Canvas */}
      <div
        ref={creatorRef}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        style={{
          height: "75vh",
        }}
      >
        {creator && <SurveyCreatorComponent creator={creator} />}
      </div>

      {/* Custom Popup for Adding Question */}
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
    </div>
  );
};

export default CreateModule;