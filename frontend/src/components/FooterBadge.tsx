import React from 'react';

const FooterBadge = () => {
  return (
    <div className="fixed bottom-4 left-0 w-full flex justify-center z-40 animate-fade-in pointer-events-none">
      <div className="bg-white/70 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-full px-5 py-2 flex items-center gap-2 pointer-events-auto transition-all hover:bg-white/90 hover:scale-105 hover:shadow-xl">
        <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-medium text-gray-500 tracking-wide uppercase">
                Entrepreneurial Initiative
            </span>
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
                Created by <span className="text-blue-600">Ran Amir</span>
                <span className="mx-1.5 text-gray-400">|</span>
                <span className="text-gray-600">B.Sc. & M.Sc. CS</span>
            </span>
        </div>
      </div>
    </div>
  );
};

export default FooterBadge;
