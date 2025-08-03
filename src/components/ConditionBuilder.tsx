import { useState } from "react";

interface ConditionBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (condition: string) => void;
  availableModules: Array<{ id: string; name: string; surveyJson: any }>;
  currentModuleId: string;
}

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  isOpen,
  onClose,
  onSave,
  availableModules,
  currentModuleId
}) => {
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [operator, setOperator] = useState<string>("equals");
  const [value, setValue] = useState<string>("");
  const [customCondition, setCustomCondition] = useState<string>("");

  const operators = [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "contains", label: "Contains" },
    { value: "greater_than", label: "Greater Than" },
    { value: "less_than", label: "Less Than" },
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" }
  ];

  const getQuestionsForModule = (moduleId: string) => {
    const module = availableModules.find(m => m.id === moduleId);
    if (!module) return [];

    return module.surveyJson?.pages?.[0]?.elements?.map((element: any) => ({
      id: element.name,
      title: element.title || element.name,
      type: element.type
    })) || [];
  };

  const buildCondition = () => {
    if (selectedModule && selectedQuestion && operator) {
      const conditionValue = operator === "yes" ? "yes" : 
                           operator === "no" ? "no" : 
                           value;
      return `${selectedModule}:${selectedQuestion}:${operator}:${conditionValue}`;
    }
    return customCondition;
  };

  const handleSave = () => {
    const condition = buildCondition();
    if (condition) {
      onSave(condition);
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedModule("");
    setSelectedQuestion("");
    setOperator("equals");
    setValue("");
    setCustomCondition("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Create Conditional Visibility</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Visual Builder */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-4">Visual Builder</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Module Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Module
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => {
                    setSelectedModule(e.target.value);
                    setSelectedQuestion("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a module</option>
                  {availableModules
                    .filter(m => m.id !== currentModuleId)
                    .map(module => (
                      <option key={module.id} value={module.id}>
                        {module.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Question Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Question
                </label>
                <select
                  value={selectedQuestion}
                  onChange={(e) => setSelectedQuestion(e.target.value)}
                  disabled={!selectedModule}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select a question</option>
                                     {selectedModule && getQuestionsForModule(selectedModule).map((question: any) => (
                    <option key={question.id} value={question.id}>
                      {question.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Operator Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operator
                </label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {operators.map(op => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Value Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Value
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={operator === "yes" || operator === "no"}
                  placeholder={operator === "yes" ? "Yes" : operator === "no" ? "No" : "Enter value"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Preview */}
            {selectedModule && selectedQuestion && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Preview:</strong> Show this module when{" "}
                  <span className="font-medium">
                    {availableModules.find(m => m.id === selectedModule)?.name}
                  </span>{" "}
                  question{" "}
                  <span className="font-medium">
                                         "{getQuestionsForModule(selectedModule).find((q: any) => q.id === selectedQuestion)?.title}"
                  </span>{" "}
                  {operator === "equals" && "equals"}
                  {operator === "not_equals" && "does not equal"}
                  {operator === "contains" && "contains"}
                  {operator === "greater_than" && "is greater than"}
                  {operator === "less_than" && "is less than"}
                  {operator === "yes" && "is Yes"}
                  {operator === "no" && "is No"}
                  {operator !== "yes" && operator !== "no" && value && (
                    <span className="font-medium">"{value}"</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Custom Condition */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-4">Custom Condition</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition Format: moduleId:questionId:operator:value
              </label>
              <input
                type="text"
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                placeholder="e.g., module1:question1:equals:yes"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Operators: equals, not_equals, contains, greater_than, less_than, yes, no
              </p>
            </div>
          </div>

          {/* Final Condition Display */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Final Condition</h4>
            <div className="bg-white p-3 rounded border border-yellow-200">
              <code className="text-sm text-gray-800">
                {buildCondition() || "No condition set"}
              </code>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!buildCondition()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save Condition
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConditionBuilder; 