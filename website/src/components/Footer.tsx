import { Github, Instagram } from "lucide-react";

const Footer = () => {
  const teamMembers = [
    { name: "Astha Kumari", github: "https://github.com/AsthaK9", instagram: "#" },
    { name: "Akash Raj", github: "https://github.com/Akash-r09", instagram: "#" },
    { name: "Shreyansh Bhadani", github: "#", instagram: "#" }
  ];

  return (
    <footer className="border-t border-border/30 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Team Members */}
          <div className="flex flex-wrap items-center gap-6">
            {teamMembers.map((member, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  {member.name}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={member.github}
                    className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/10"
                    aria-label={`${member.name}'s GitHub`}
                  >
                    <Github size={16} />
                  </a>
                  <a
                    href={member.instagram}
                    className="text-muted-foreground hover:text-accent transition-colors p-1 rounded-full hover:bg-accent/10"
                    aria-label={`${member.name}'s Instagram`}
                  >
                    <Instagram size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-xs text-muted-foreground">
            © 2024 Digital Fingerprint Project
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;