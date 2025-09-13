export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-black" />
            <span className="text-4xl font-bold uppercase tracking-tighter">
              Spottr
            </span>
          </div>
        </div>
        
        {/* Auth Form Container */}
        <div className="border-4 border-black bg-white p-8 shadow-brutal">
          {children}
        </div>
        
        {/* Footer */}
        <p className="text-center mt-8 font-mono text-xs uppercase text-gray-600">
          AI-Powered Video Analysis Platform
        </p>
      </div>
    </div>
  );
}