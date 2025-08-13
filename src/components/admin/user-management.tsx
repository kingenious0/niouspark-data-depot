
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

interface UserManagementProps {
  initialUsers: User[];
}

export default function UserManagement({ initialUsers }: UserManagementProps) {
  const [users, setUsers] = React.useState(initialUsers);
  const [loading, setLoading] = React.useState<string | null>(null);
  const { toast } = useToast();
  const currentUser = auth.currentUser;

  const handleRoleChange = async (userId: string, newRole: "admin" | "customer") => {
    setLoading(userId);
    try {
        const idToken = await currentUser?.getIdToken();
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

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
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
                  disabled={loading === user.id || user.id === currentUser?.uid}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
