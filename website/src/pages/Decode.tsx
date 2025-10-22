import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scan, CheckCircle, FileText } from "lucide-react";
import TechBackground from "@/components/TechBackground";
import Footer from "@/components/Footer";
import UploadZone from "@/components/UploadZone";
import LoadingSpinner from "@/components/LoadingSpinner";

type DecodeState = "upload" | "processing" | "complete";

interface DecodedMetadata {
  fingerprint: string;
  timestamp: string;
  algorithm: string;
  security_level: string;
  origin: string;
  checksum: string;
}

const Decode = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<DecodeState>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [metadata, setMetadata] = useState<DecodedMetadata | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const startDecoding = async () => {
    if (!selectedFile) return;
    setState("processing");
    setProgress(0);

    const formData = new FormData();
    formData.append("image", selectedFile);

    let interval: number;

    try {
      // Fake loader animation
      interval = window.setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 12, 90));
      }, 250);

      const res = await fetch("http://127.0.0.1:5001/api/decode", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      clearInterval(interval);

      // Flask should return decoded metadata object
      setMetadata(data.decoded_data);
      setProgress(100);
      setState("complete");
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      setState("upload");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TechBackground />

      {/* Header */}
      <header className="border-b border-border/30 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
          </Button>
          <div className="flex items-center space-x-2">
            <Scan className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-semibold">Decode Fingerprint</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {state === "upload" && (
            <>
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Decode Fingerprint</h2>
                <p className="text-muted-foreground">
                  Upload a fingerprinted image to extract its embedded metadata and verify its authenticity.
                </p>
              </div>

              <UploadZone onFileSelect={handleFileSelect} />

              {selectedFile && (
                <div className="text-center mt-4">
                  <Button
                    onClick={startDecoding}
                    className="neon-btn border-accent text-accent hover:text-accent-foreground px-8 py-3 text-lg"
                    variant="outline"
                    size="lg"
                  >
                    Start Decoding Process
                  </Button>
                </div>
              )}

              {selectedFile && (
                <div className="mt-4 flex justify-center">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-full max-w-sm object-contain border rounded-lg"
                  />
                </div>
              )}
            </>
          )}

          {state === "processing" && (
            <div className="text-center py-16">
              <LoadingSpinner
                message="Decoding digital fingerprint..."
                progress={progress}
              />
              {selectedFile && (
                <div className="mt-4 flex justify-center">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-full max-w-sm object-contain border rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {state === "complete" && metadata && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-green-500/10 border-2 border-green-500/20">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-green-400">
                  Fingerprint Decoded Successfully!
                </h2>
                <p className="text-muted-foreground">
                  Here's the extracted metadata from your image.
                </p>
              </div>

              <div className="glass-panel rounded-lg p-6 border-2 border-accent/30">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 pb-4 border-b border-border/30">
                    <FileText className="w-6 h-6 text-accent" />
                    <h3 className="text-xl font-semibold">Decoded Metadata</h3>
                  </div>

                  <div className="grid gap-4">
                    {Object.entries(metadata).map(([key, value]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="text-sm font-medium text-muted-foreground min-w-[140px] uppercase tracking-wider">
                          {key.replace('_', ' ')}:
                        </div>
                        <div className="font-mono text-sm bg-muted/50 px-3 py-1 rounded border flex-1">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border/30">
                    <div className="flex items-center space-x-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Fingerprint Verified</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      This image contains a valid digital fingerprint with intact metadata.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="neon-btn border-secondary text-secondary px-6 py-3"
                  size="lg"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Decode;
