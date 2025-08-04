import React, { useState, useEffect } from 'react';

interface ConditionBuilderProps {
  modules?: Array<{
    id: string;
    name: string;
    surveyJson: any;
  }>;
  availableModules?: Array<{
    id: string;
    name: string;
    surveyJson: any;
  }>;
  onConditionChange?: (condition: string) => void;
  onSave?: (condition: string) => void;
  currentCondition?: string;
  isOpen: boolean;
  onClose: () => void;
  currentModuleId?: string;
}

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  modules = [],
  availableModules = [],
  onConditionChange,
  onSave,
  currentCondition,
  isOpen,
  onClose,
  currentModuleId
}) => {
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [operator, setOperator] = useState<string>('equals');
  const [value, setValue] = useState<string>('');
  const [availableQuestions, setAvailableQuestions] = useState<Array<{name: string, title: string}>>([]);

  // Use availableModules if provided, otherwise use modules
  const moduleList = availableModules.length > 0 ? availableModules : modules;

  useEffect(() => {
    if (selectedModule) {
      const module = moduleList.find(m => m.id === selectedModule);
      if (module?.surveyJson?.pages?.[0]?.elements) {
        const questions = module.surveyJson.pages[0].elements.map((element: any) => ({
          name: element.name,
          title: element.title || element.name
        }));
        setAvailableQuestions(questions);
      }
    } else {
      setAvailableQuestions([]);
    }
    setSelectedQuestion('');
  }, [selectedModule, moduleList]);

  useEffect(() => {
    if (currentCondition) {
      const parts = currentCondition.split(':');
      if (parts.length === 4) {
        setSelectedModule(parts[0]);
        setSelectedQuestion(parts[1]);
        setOperator(parts[2]);
        setValue(parts[3]);
      }
    }
  }, [currentCondition]);

  const buildCondition = () => {
    if (selectedModule && selectedQuestion && operator && value) {
      const condition = `${selectedModule}:${selectedQuestion}:${operator}:${value}`;
      if (onConditionChange) {
        onConditionChange(condition);
      }
      return condition;
    }
    return '';
  };

  useEffect(() => {
    buildCondition();
  }, [selectedModule, selectedQuestion, operator, value]);

  const handleSave = () => {
    const condition = buildCondition();
    if (condition && onSave) {
      onSave(condition);
    } else if (condition && onConditionChange) {
      onConditionChange(condition);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Custom Condition Builder</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Module Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Module
            </label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a module</option>
              {moduleList.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </select>
          </div>

          {/* Question Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Question
            </label>
            <select
              value={selectedQuestion}
              onChange={(e) => setSelectedQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedModule}
            >
              <option value="">Select a question</option>
              {availableQuestions.map((question) => (
                <option key={question.name} value={question.name}>
                  {question.title}
                </option>
              ))}
            </select>
          </div>

          {/* Operator Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="equals">equals</option>
              <option value="not_equals">not equals</option>
              <option value="contains">contains</option>
              <option value="greater_than">greater than</option>
              <option value="less_than">less than</option>
              <option value="yes">is yes</option>
              <option value="no">is no</option>
            </select>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter expected value"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Condition Preview */}
          {selectedModule && selectedQuestion && operator && value && (
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Condition:</strong> Show this module when question "{selectedQuestion}" in "{moduleList.find(m => m.id === selectedModule)?.name}" {operator} "{value}"
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedModule || !selectedQuestion || !operator || !value}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {onSave ? 'Apply Condition' : 'Save Condition'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConditionBuilder; 