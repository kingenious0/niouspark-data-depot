import { PredictionClient } from "./prediction-client";

export default function PredictionPage() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
       <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline tracking-tight">
            AI Sales Analyst
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
            Get real-time insights into your sales performance using generative AI.
          </p>
        </div>
      <PredictionClient />
    </div>
  );
}