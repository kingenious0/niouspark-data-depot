import ParaphraserStats from "@/components/admin/paraphraser-stats";

export const dynamic = 'force-dynamic';

export default function AdminParaphraserPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Paraphraser Analytics</h1>
        <p className="text-muted-foreground">
          Monitor paraphraser usage, performance metrics, and user activity.
        </p>
      </div>
      
      <ParaphraserStats />
    </div>
  );
}
