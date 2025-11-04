import DownloadCV from './DownloadCV';

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo / Nome */}
        <div className="flex items-center">
          <span className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            DF
          </span>
        </div>

        {/* Botão de Download do Currículo */}
        <div className="flex items-center">
          <DownloadCV />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
