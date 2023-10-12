const AxeSkeleton = () => {
  return (
    <div className="flex items-center w-full px-2 py-2 ">
      <div className="h-6 fr-icon-arrow-right-s-fill text-gray-600" />
      <div className="animate-pulse h-8 w-full ml-6 rounded-sm bg-gray-200" />
    </div>
  );
};

export default AxeSkeleton;
