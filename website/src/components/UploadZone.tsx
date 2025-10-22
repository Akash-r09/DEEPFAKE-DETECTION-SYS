import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  className?: string;
}

const UploadZone = ({ onFileSelect, accept = "image/*", className = "" }: UploadZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    onFileSelect(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!selectedFile ? (
        <div
          className={`upload-zone rounded-lg p-8 text-center transition-all duration-smooth cursor-pointer ${
            isDragOver ? "drag-over" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium mb-2">Drop your file here</p>
              <p className="text-sm text-muted-foreground">
                or click to select from your device
              </p>
            </div>
            <Button variant="outline" className="neon-btn">
              Select File
            </Button>
          </div>
          <input
            id="file-input"
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      ) : (
        <div className="glass-panel rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ImageIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {preview && (
            <div className="mt-4 rounded-lg overflow-hidden border border-border/50">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadZone;