"use client";

import * as React from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { cn } from "@/lib/utils";

interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: File[] | null;
  onValueChange?: (files: File[] | null) => void;
  dropzoneOptions?: DropzoneOptions;
  orientation?: "vertical" | "horizontal";
}

const FileUploader = React.forwardRef<HTMLDivElement, FileUploaderProps>(
  ({ className, dropzoneOptions, orientation = "vertical", value, onValueChange, ...props }, ref) => {
    const [files, setFiles] = React.useState<File[] | null>(null);

    const onDrop = React.useCallback(
      (acceptedFiles: File[]) => {
        setFiles(acceptedFiles);
        onValueChange?.(acceptedFiles);
      },
      [onValueChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      ...dropzoneOptions,
    });

    React.useEffect(() => {
      if (value !== undefined) {
        setFiles(value);
      }
    }, [value]);

    return (
      <div
        ref={ref}
        {...getRootProps()}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-md",
          className
        )}
        {...props}
      >
        <input {...getInputProps()} />
        {props.children}
      </div>
    );
  }
);
FileUploader.displayName = "FileUploader";

interface FileInputProps extends React.HTMLAttributes<HTMLDivElement> { }

const FileInput = React.forwardRef<HTMLDivElement, FileInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border p-4 transition-colors hover:border-primary/50",
          className
        )}
        {...props}
      />
    );
  }
);
FileInput.displayName = "FileInput";

interface FileUploaderContentProps extends React.HTMLAttributes<HTMLDivElement> { }

const FileUploaderContent = React.forwardRef<HTMLDivElement, FileUploaderContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap gap-2", className)}
        {...props}
      />
    );
  }
);
FileUploaderContent.displayName = "FileUploaderContent";

interface FileUploaderItemProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number;
}

const FileUploaderItem = React.forwardRef<HTMLDivElement, FileUploaderItemProps>(
  ({ className, index, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-md border bg-background p-2",
          className
        )}
        {...props}
      />
    );
  }
);
FileUploaderItem.displayName = "FileUploaderItem";

export {
  FileUploader,
  FileInput,
  FileUploaderContent,
  FileUploaderItem,
};