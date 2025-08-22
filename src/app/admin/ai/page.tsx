// src/app/admin/ai/page.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function AdminAIPage() {
  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 h-full">
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader className="text-center">
          <Construction className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <CardTitle className="text-2xl">AI Suite - Under Maintenance</CardTitle>
          <CardDescription className="text-lg">
            The Admin AI features are being updated to support the latest AI models.
            This section will be available again soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>In the meantime, you can use the main AI chat feature available to all users.</p>
        </CardContent>
      </Card>
    </div>
  );
}
