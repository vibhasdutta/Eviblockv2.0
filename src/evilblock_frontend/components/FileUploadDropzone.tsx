'use client';

import {
  FileUploader,
  FileInput,
} from '@/components/ui/file-upload';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import { DropzoneOptions } from 'react-dropzone';

const FileSvgDraw = () => {
  return (
    <>
      <svg
        className='w-8 h-8 mb-3 text-primary'
        aria-hidden='true'
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 20 16'
      >
        <path
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2'
        />
      </svg>
      <p className='mb-1 text-sm  text-primary'>
        <span className='font-semibold'>Click to upload</span>
        &nbsp; or drag and drop
      </p>
      <p className='text-xs  text-primary'>PDF or DOC/DOCX (max 10MB)</p>
    </>
  );
};

const FileUploadDropzone = ({ onFileSelect }: { onFileSelect?: (file: File | null) => void }) => {
  const [files, setFiles] = useState<File[] | null>([]);

  const dropzone = {
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false, // Single file only
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  } satisfies DropzoneOptions;

  const handleValueChange = (newFiles: File[] | null) => {
    setFiles(newFiles);
    // Call the callback with the first file or null
    onFileSelect?.(newFiles && newFiles.length > 0 ? newFiles[0] : null);
  };

  return (
    <div className='py-8'>
      <FileUploader
        value={files}
        orientation='vertical'
        onValueChange={handleValueChange}
        dropzoneOptions={dropzone}
        className='relative rounded-lg p-2 w-full max-w-md mx-auto'
      >
        <FileInput className='outline-dashed dark:bg-neutral-800 bg-neutral-50 outline-2 outline-primary/40'>
          <div className='flex items-center justify-center flex-col pt-6 pb-6 w-full'>
            {files && files.length > 0 ? (
              // Show selected file name
              <div className='text-center'>
                <FileText className='w-8 h-8 mb-3 text-green-600 mx-auto' />
                <p className='mb-1 text-sm font-medium text-green-700'>
                  File Selected
                </p>
                <p className='text-xs text-gray-600 dark:text-gray-400 truncate max-w-[200px]'>
                  {files[0].name}
                </p>
              </div>
            ) : (
              // Show upload instructions
              <FileSvgDraw />
            )}
          </div>
        </FileInput>
      </FileUploader>
    </div>
  );
};

export default FileUploadDropzone;