export const SkeletonTrailerCard = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex flex-col h-full animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 bg-gray-200"></div>

      {/* Content Skeleton */}
      <div className="p-5 flex-grow flex flex-col">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>

        {/* Specs Skeleton */}
        <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>

        {/* Tags Skeleton */}
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-6 bg-gray-200 rounded w-12"></div>
        </div>

        {/* Footer Skeleton */}
        <div className="pt-4 border-t border-gray-100 mt-auto">
          <div className="flex justify-between mb-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded-full w-8"></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
