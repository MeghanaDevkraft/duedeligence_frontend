// src/components/ModuleView.tsx
interface Module {
  id: string;
  name: string;
  surveyJson: any;
}

interface ModuleViewProps {
  module: Module;
  onClose: () => void;
}

export function ModuleView({ module, onClose }: ModuleViewProps) {
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
            <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
            {module.surveyJson && module.surveyJson.pages ? (
              module.surveyJson.pages.map((page: any, pageIndex: number) => (
                <div key={pageIndex} className="space-y-4">
                  <h4 className="font-medium text-gray-800 text-lg">Page {pageIndex + 1}</h4>
                  {page.elements && page.elements.map((element: any, elementIndex: number) => (
                    <div key={elementIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-2">
                            {element.title || `Question ${elementIndex + 1}`}
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
}