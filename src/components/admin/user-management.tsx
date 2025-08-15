"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { Button } from "../ui/button";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";

interface UserManagementProps {
  initialUsers: User[];
}

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

export default function UserManagement({ initialUsers }: UserManagementProps) {
  const [users, setUsers] = React.useState(initialUsers);
  const [loading, setLoading] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const isSuperAdmin = currentUser?.email === SUPER_ADMIN_EMAIL;

  const handleRoleChange = async (userId: string, newRole: "admin" | "customer") => {
    setLoading(userId);
    try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
            throw new Error("Authentication token not found.");
        }

        const response = await fetch('/api/auth/set-role', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ userId, newRole }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to update role.');
        }

        setUsers((prevUsers) =>
            prevUsers.map((user) =>
                user.id === userId ? { ...user, role: newRole } : user
            )
        );

        toast({
            title: "Role Updated",
            description: `User role has been changed to ${newRole}.`,
        });
    } catch (error: any) {
        toast({
            title: "Update Failed",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setLoading(null);
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    setDeletingId(userId);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentication required.");

      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ userIdToDelete: userId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete user.');

      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({ title: 'User Deleted', description: 'The user has been successfully removed.' });

    } catch (error: any) {
      toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.name}</span>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value: "admin" | "customer") =>
                    handleRoleChange(user.id, value)
                  }
                  disabled={loading === user.id || !isSuperAdmin || user.id === currentUser?.uid}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              {isSuperAdmin && (
                 <TableCell className="text-right">
                    {user.id !== currentUser?.uid && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={deletingId === user.id}>
                                    {deletingId === user.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive"/>}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User: {user.name}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the user and all their associated data. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">
                                        Yes, delete user
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}