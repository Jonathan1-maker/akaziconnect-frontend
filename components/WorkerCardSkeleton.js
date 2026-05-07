export default function WorkerCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-slate-700 flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-lg w-3/4" />
          <div className="h-3 bg-gray-100 dark:bg-slate-600 rounded-lg w-1/2" />
          <div className="h-3 bg-gray-100 dark:bg-slate-600 rounded-lg w-2/3" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-slate-700">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-lg w-24" />
        <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded-xl w-24" />
      </div>
    </div>
  );
}
