import UserManagement from "@/components/admin/user-management";
import { adminAuth } from "@/lib/firebase-admin";
import type { User } from "@/lib/data";

// This line is crucial for Vercel. It tells Next.js to always
// render this page dynamically on the server for each request.
export const dynamic = 'force-dynamic';

async function getAllUsers(): Promise<User[]> {
    try {
        const userRecords = await adminAuth.listUsers();
        const users = await Promise.all(userRecords.users.map(async (userRecord) => {
            const customClaims = (userRecord.customClaims || {}) as { role?: 'admin' | 'customer' };
            return {
                id: userRecord.uid,
                name: userRecord.displayName || 'No Name',
                email: userRecord.email || 'No Email',
                role: customClaims.role || 'customer',
                avatarUrl: userRecord.photoURL || `https://placehold.co/40x40.png?text=${(userRecord.displayName || 'N').charAt(0)}`,
            };
        }));
        return users;
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
}


export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage user roles and permissions.</p>
      </div>
      <UserManagement initialUsers={users} />
    </div>
  );
}