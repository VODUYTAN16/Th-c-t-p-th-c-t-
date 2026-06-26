import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface CVReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleSelect: () => void;
  isSelected: boolean;
  fileName: string;
  fileUrl: string | null;
}

export default function CVReviewModal({ isOpen, onClose, onToggleSelect, isSelected, fileName, fileUrl }: CVReviewModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col h-[85vh]">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-slate-900 border-b px-6 py-4 flex justify-between items-center bg-slate-50"
                >
                  <span className="truncate pr-4" title={fileName}>
                    {fileName}
                  </span>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Dialog.Title>
                
                <div className="flex-1 bg-slate-100 p-4 overflow-hidden relative">
                  {!fileUrl ? (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang tải file...
                    </div>
                  ) : (
                    <iframe
                      src={fileUrl}
                      className="w-full h-full rounded border border-slate-300 bg-white"
                      title="CV Preview"
                    />
                  )}
                </div>

                <div className="border-t px-6 py-4 flex justify-end space-x-3 bg-white">
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-lg border border-transparent px-5 py-2 text-sm font-medium text-white focus:outline-none ${
                      isSelected 
                        ? "bg-red-500 hover:bg-red-600" 
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    onClick={() => {
                      onToggleSelect();
                      onClose();
                    }}
                  >
                    {isSelected ? "Bỏ chọn CV này" : "Chọn CV này"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
