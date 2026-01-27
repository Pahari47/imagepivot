'use client';

interface HeroSectionProps {
  onGetStarted: () => void;
  onStartTrial: () => void;
}

export function HeroSection({ onGetStarted, onStartTrial }: HeroSectionProps) {
  return (
    <div className="max-w-7xl -mt-20 mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Section - Text Content */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 leading-tight">
              <span key="format" className="block">Any Format,</span>
              <span key="size" className="block">Any Size.</span>
              <span key="friction" className="block">Zero Friction</span>
            </h1>
            <p className="text-lg lg:text-xl text-gray-700 max-w-xl">
              The lightning-fast media engine convert, resize & optimize your image, audio and video
              in one place.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              key="trial"
              onClick={onStartTrial}
              className="px-8 py-3 border-2 border-gray-900 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Start your free trial
            </button>
            <button
              key="get-started"
              onClick={onGetStarted}
              className="px-8 py-3 bg-black text-white rounded-md text-base font-medium hover:bg-gray-800 transition-colors"
            >
              Get Started
            </button>
          </div>

          {/* Statistics */}
          <div className="flex items-center gap-8 pt-8">
            <div key="stat-1">
              <div className="text-4xl font-bold text-gray-900">3000+</div>
              <div className="text-sm text-gray-600 mt-1">Daily Converted</div>
            </div>
            <div key="divider" className="h-12 w-px bg-gray-300"></div>
            <div key="stat-2">
              <div className="text-4xl font-bold text-gray-900">1M+</div>
              <div className="text-sm text-gray-600 mt-1">Conversion Completed</div>
            </div>
          </div>
        </div>

        {/* Right Section - Image */}
        <div className="hidden lg:block">
          <div className="w-full h-full flex items-center justify-center">
            <img
              src="/uploadimage.png"
              alt="Media conversion illustration"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

