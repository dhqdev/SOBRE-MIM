import { Heart, Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Github, url: 'https://github.com/dhqdev', label: 'GitHub' },
    { icon: Linkedin, url: 'https://linkedin.com/in/david-fernandes-dev', label: 'LinkedIn' },
    { icon: Mail, url: 'mailto:david@tekvosoft.dev', label: 'Email' }
  ];

  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-8">

            {/* Social Links */}
            <div className="flex justify-center gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-card border border-border hover:border-primary transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </a>
              ))}
            </div>

            {/* Copyright */}
            <div className="pt-8 border-t border-border">

            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;