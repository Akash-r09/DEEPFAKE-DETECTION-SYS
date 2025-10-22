import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, CheckCircle, Shield } from "lucide-react";
import TechBackground from "@/components/TechBackground";
import Footer from "@/components/Footer";
import UploadZone from "@/components/UploadZone";
import LoadingSpinner from "@/components/LoadingSpinner";

type EmbedState = "upload" | "processing" | "complete";

const Embed = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<EmbedState>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [username, setUsername] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [embeddedMetadata, setEmbeddedMetadata] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const startEmbedding = async () => {
    if (!selectedFile || !username) return;

    setState("processing");
    setProgress(0);

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("username", username);

    let interval: number;

    try {
      // Loader animation
      interval = window.setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 10, 90));
      }, 200);

      const res = await fetch("http://127.0.0.1:5000/api/embed", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      clearInterval(interval);

      // Flask returns filename + embedded metadata
      setProcessedImage(`http://127.0.0.1:5000/fingerprinted/${data.fingerprinted_image}`);
      setEmbeddedMetadata(data.embedded_metadata || null);
      setProgress(100);
      setState("complete");
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      setState("upload");
    }
  };

  const downloadImage = () => {
    if (processedImage) {
      const link = document.createElement("a");
      link.href = processedImage;
      link.download = `fingerprinted_${selectedFile?.name || "image"}`;
      link.click();
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
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold">Embed Fingerprint</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {state === "upload" && (
            <>
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Upload Your Image</h2>
                <p className="text-muted-foreground">
                  Select an image to embed with a digital fingerprint for secure authentication.
                </p>
              </div>

              <UploadZone onFileSelect={handleFileSelect} />

              {selectedFile && (
                <div className="text-center space-y-4">
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border rounded-lg px-4 py-2 w-full max-w-sm text-black"
                  />
                  <Button
                    onClick={startEmbedding}
                    className="neon-btn px-8 py-3 text-lg"
                    size="lg"
                  >
                    Start Embedding Process
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
                message="Embedding digital fingerprint..."
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

          {state === "complete" && processedImage && (
            <div className="text-center space-y-8">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-green-500/10 border-2 border-green-500/20">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-green-400">
                Fingerprint Embedded Successfully!
              </h2>
              <p className="text-muted-foreground">
                Your image has been secured with a digital fingerprint.
              </p>

              <div className="glass-panel rounded-lg p-6 mx-auto max-w-md space-y-4">
                <img
                  src={processedImage}
                  alt="Fingerprinted"
                  className="w-full max-h-96 object-contain rounded-lg"
                />
                {embeddedMetadata && (
                  <div className="mt-4 text-left bg-black/40 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg text-green-300">Embedded Metadata</h3>
                    <p className="text-sm text-white">{embeddedMetadata}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={downloadImage} className="neon-btn px-6 py-3" size="lg">
                  <Download className="w-5 h-5 mr-2" /> Download Image
                </Button>
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

export default Embed;
