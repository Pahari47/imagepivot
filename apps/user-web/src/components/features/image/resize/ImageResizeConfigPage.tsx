'use client';

import { FeatureConfigPageProps } from '../../../../lib/features/types';
import { ImagePreview } from '../../../../components/upload/ImagePreview';
import { ImageResizeConfig } from './ImageResizeConfig';
import { ResizeConfig } from './ImageResizeConfig';

export function ImageResizeConfigPage({
  config,
  onChange,
  selectedFile,
  onRemoveFile,
  onProcess,
  error
}: FeatureConfigPageProps) {
  const resizeConfig = config as ResizeConfig;

  const handleResolutionPreset = (preset: string) => {
    switch (preset) {
      case 'yt-thumbnail':
        onChange({ ...resizeConfig, width: 1280, height: 720 });
        break;
      case '9:16':
        onChange({ ...resizeConfig, width: 1080, height: 1920 });
        break;
      case 'insta-crop':
        onChange({ ...resizeConfig, width: 1080, height: 1080 });
        break;
      case '16:9':
        onChange({ ...resizeConfig, width: 1920, height: 1080 });
        break;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 text-center">Change size of your image</h2>
      <p className="text-gray-600 text-sm text-center">
        Upload image and select resolution to turn it in your desire frame
      </p>
      <div className="grid grid-cols-2 gap-6 mt-6">
        {/* Left Section: Image Preview */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Image ready to convert</h3>
          <ImagePreview
            file={selectedFile}
            onRemove={undefined}
            isUploading={false}
            uploadProgress={0}
          />
        </div>

        {/* Middle Section: Resize Configuration */}
        <div className='grid grid-cols-2'>
          <div className="p-6">

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <ImageResizeConfig
              config={resizeConfig}
              onChange={onChange}
              selectedFile={selectedFile}
            />
          </div>

          {/* Right Section: Resolution Options */}
          <div>
            <div className="grid grid-cols-2 mb-4">
              <button
                onClick={onRemoveFile}
                className="flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Change Image
              </button>
              {/* Process Button */}
              <button
                onClick={onProcess}
                className="flex items-center p-1 justify-center gap-1 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Process Image
              </button>
            </div>

            {/* Popular Resolution Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Popular resolution</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                onChange={(e) => {
                  if (e.target.value) {
                    handleResolutionPreset(e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">Select a preset</option>
                <option value="yt-thumbnail">YT thumbnail</option>
                <option value="9:16">9:16</option>
                <option value="insta-crop">Insta crop</option>
                <option value="16:9">16:9</option>
              </select>
            </div>

            {/* Resolution Presets List */}
            {/* <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            <div
              onClick={() => handleResolutionPreset('yt-thumbnail')}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <span className="text-sm text-gray-700">YT thumbnail</span>
            </div>
            <div
              onClick={() => handleResolutionPreset('9:16')}
              className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer ${(resizeConfig.width === 1080 && resizeConfig.height === 1920) ? 'bg-purple-50' : ''
                }`}
            >
              <span className="text-sm text-gray-700">9:16</span>
              {(resizeConfig.width === 1080 && resizeConfig.height === 1920) && (
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div
              onClick={() => handleResolutionPreset('insta-crop')}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <span className="text-sm text-gray-700">Insta crop</span>
            </div>
            <div
              onClick={() => handleResolutionPreset('16:9')}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <span className="text-sm text-gray-700">16:9</span>
            </div>
          </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

