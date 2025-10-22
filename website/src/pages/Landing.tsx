import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Upload, Scan } from "lucide-react";
import TechBackground from "@/components/TechBackground";
import Footer from "@/components/Footer";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <TechBackground />
      
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="text-center space-y-12 max-w-4xl mx-auto">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <div className="p-6 rounded-full bg-primary/10 border-2 border-primary/20 animate-glow-pulse">
              <Shield className="w-16 h-16 text-primary" />
            </div>
          </div>

          {/* Main Quote */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-neon bg-clip-text text-transparent">
                Making the digital world secure,
              </span>
              <br />
              <span className="text-foreground">
                one fingerprint at a time.
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Advanced digital fingerprinting technology for secure authentication and verification.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            <Button
              onClick={() => navigate("/embed")}
              className="neon-btn group px-8 py-6 text-lg font-medium min-w-[200px]"
              size="lg"
            >
              <Upload className="w-5 h-5 mr-3 group-hover:animate-bounce" />
              Embed Fingerprint
            </Button>
            
            <Button
              onClick={() => navigate("/decode")}
              variant="outline"
              className="neon-btn group px-8 py-6 text-lg font-medium min-w-[200px] border-accent text-accent hover:text-accent-foreground"
              size="lg"
            >
              <Scan className="w-5 h-5 mr-3 group-hover:animate-bounce" />
              Decode Fingerprint
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 pt-16">
            {[
              {
                icon: Shield,
                title: "Secure",
                description: "Military-grade encryption ensures your data stays protected."
              },
              {
                icon: Upload,
                title: "Fast",
                description: "Process fingerprints in seconds with our optimized algorithms."
              },
              {
                icon: Scan,
                title: "Reliable",
                description: "99.9% accuracy rate with advanced detection technology."
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="glass-panel rounded-lg p-6 hover:scale-105 transition-transform duration-smooth group"
              >
                <div className="text-center space-y-4">
                  <div className="inline-flex p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;