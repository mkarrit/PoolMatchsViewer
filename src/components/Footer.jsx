const Footer = () => {
  return (
    <footer className="fixed bottom-0 w-full py-2 bg-black/5 backdrop-blur-sm border-t border-white/10">
      <div className="container mx-auto text-center">
        <p className="text-gray-600 text-xs font-light">
          Powered by{" "}
          <span className="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-300">
            Mouhcine KARRIT
          </span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;