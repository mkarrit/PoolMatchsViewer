const Footer = () => {
  return (
    <footer className="fixed bottom-0 w-full py-2 bg-black/20 backdrop-blur-sm border-t border-white/10">
      <div className="container mx-auto text-center">
        {/* Couleurs issues du thème : text-gray-600 devenait illisible sur les
            fonds sombres de l'application. */}
        <p className="text-text-muted text-xs font-light">
          Powered by{" "}
          <span className="font-medium text-accent">Mouhcine KARRIT</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
