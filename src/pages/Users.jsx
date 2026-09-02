import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";

import {
  StatusBadge,
  EmptyState,
  TableSkeleton,
} from "@/components/common";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  UserPlus,
  MoreHorizontal,
  Users as UsersIcon,
  Copy,
  Search,
} from "lucide-react";

import { toast } from "sonner";

/* ============================================================
  ROLE LABELS
============================================================ */

const ROLE_LABELS = {
  organization_admin: "Organization Admin",
  organization_member: "Organization Member",
  company_admin: "Company Admin",

  // Keep these in case backend returns them later
  org_admin: "Organization Admin",
  hr_admin: "HR Admin",
  recruiter: "Recruiter",
  hiring_manager: "Hiring Manager",
  interviewer: "Interviewer",
  viewer: "Viewer / Management",
};

/* ============================================================
  ROLE FORMATTER
============================================================ */

const formatRole = (role) => {
  if (!role) return "—";

  if (ROLE_LABELS[role]) {
    return ROLE_LABELS[role];
  }

  return String(role)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

/* ============================================================
  AVATAR INITIALS
============================================================ */

const getInitials = (name) => {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

/* ============================================================
  DATE FORMATTER
============================================================ */

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString();
};

/* ============================================================
  USER STATUS
============================================================ */

const getUserStatus = (user) => {
  return user?.is_active ? "active" : "inactive";
};

/* ============================================================
  COMPONENT
============================================================ */

export default function UsersPage() {
  const [users, setUsers] = useState(null);

  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    role: "organization_admin",
    password: "",
  });

  const [saving, setSaving] = useState(false);

  const [inviteLink, setInviteLink] = useState(null);

  /* ==========================================================
    LOAD ORGANIZATION MEMBERS

    API:
    GET /api/organizations/me/members
  ========================================================== */

  const load = async () => {
    try {
      const response = await api.get(
        "/organizations/me/members"
      );

      console.log(
        "Organization Members API:",
        response.data
      );

      /*
       * API normally returns:
       *
       * [
       *   {
       *     id,
       *     name,
       *     email,
       *     phone,
       *     role,
       *     company_id,
       *     is_active,
       *     is_verified,
       *     created_at,
       *     updated_at
       *   }
       * ]
       *
       * Handle both array and single-object responses.
       */

      const memberData = Array.isArray(response.data)
        ? response.data
        : response.data
          ? [response.data]
          : [];

      setUsers(memberData);
    } catch (error) {
      console.error(
        "Organization members API error:",
        error
      );

      console.error(
        "Status:",
        error.response?.status
      );

      console.error(
        "Response:",
        error.response?.data
      );

      setUsers([]);
    }
  };

  /* ==========================================================
    INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    load();
  }, []);

  /* ==========================================================
    SEARCH
  ========================================================== */

  const filtered = (users || []).filter((user) => {
    const searchText = [
      user.name,
      user.email,
      user.phone,
      user.role,
      user.department,
      user.designation,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchText.includes(
      q.toLowerCase()
    );
  });

  /* ==========================================================
    CREATE ORGANIZATION MEMBER

    API:
    POST /api/organizations/me/members

    Request:
    {
      name: "string",
      email: "user@example.com",
      phone: "string",
      department: "string",
      designation: "string",
      role: "organization_admin",
      password: "string"
    }
  ========================================================== */

  const createUser = async () => {
    setSaving(true);

    try {
      const name = `${form.first_name} ${form.last_name}`
        .trim()
        .replace(/\s+/g, " ");

      const payload = {
        name,
        email: form.email.trim(),
        phone: form.phone.trim(),
        department: form.department.trim(),
        designation: form.designation.trim(),
        role: form.role,
        password: form.password,
      };

      console.log(
        "Create Organization Member Payload:",
        payload
      );

      const { data } = await api.post(
        "/organizations/me/members",
        payload
      );

      console.log(
        "Create Organization Member API:",
        data
      );

      /*
       * If backend returns an invitation/reset link,
       * keep supporting it.
       */
      if (data?.invite_link) {
        setInviteLink(data.invite_link);
      } else if (data?.invitation_link) {
        setInviteLink(data.invitation_link);
      } else if (data?.simulated_reset_link) {
        setInviteLink(data.simulated_reset_link);
      }

      toast.success(
        "User created successfully"
      );

      await load();

      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        department: "",
        designation: "",
        role: "organization_admin",
        password: "",
      });

      /*
       * Close dialog unless backend provides
       * an invitation link.
       */
      if (
        !data?.invite_link &&
        !data?.invitation_link &&
        !data?.simulated_reset_link
      ) {
        setOpen(false);
      }

    } catch (error) {
      console.error(
        "Create organization member error:",
        error
      );

      console.error(
        "Status:",
        error.response?.status
      );

      console.error(
        "Response:",
        error.response?.data
      );

      toast.error(
        formatApiError(
          error.response?.data?.detail
        ) || "Failed to create user."
      );

    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
    TOGGLE USER STATUS

    PATCH:
    /api/organizations/me/members/{id}/status
  ========================================================== */

  const toggleStatus = async (user) => {
    try {
      const newStatus = !user.is_active;

      await api.patch(
        `/organizations/me/members/${user.id}/status`,
        {
          is_active: newStatus,
        }
      );

      toast.success(
        newStatus
          ? "User activated successfully"
          : "User deactivated successfully"
      );

      await load();

    } catch (error) {
      console.error(
        "Update member status error:",
        error
      );

      console.error(
        "Status:",
        error.response?.status
      );

      console.error(
        "Response:",
        error.response?.data
      );

      toast.error(
        formatApiError(
          error.response?.data?.detail
        ) || "Failed to update user status."
      );
    }
  };

  /* ==========================================================
    RESET PASSWORD
  ========================================================== */

  const resetPw = async (user) => {
    try {
      const { data } = await api.post(
        `/users/${user.id}/reset-password`
      );

      if (data?.simulated_reset_link) {
        navigator.clipboard?.writeText(
          window.location.origin +
            data.simulated_reset_link
        );
      }

      toast.success(
        "Reset link generated & copied (simulated)"
      );

    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      console.error(
        "Status:",
        error.response?.status
      );

      console.error(
        "Response:",
        error.response?.data
      );

      toast.error(
        formatApiError(
          error.response?.data?.detail
        ) || "Failed to reset password."
      );
    }
  };

  /* ==========================================================
    DELETE USER
  ========================================================== */

  const removeUser = async (user) => {
    try {
      await api.delete(
        `/organizations/me/members/${user.id}`
      );

      toast.success(
        "User deleted successfully"
      );

      await load();

    } catch (error) {
      console.error(
        "Delete organization member error:",
        error
      );

      console.error(
        "Status:",
        error.response?.status
      );

      console.error(
        "Response:",
        error.response?.data
      );

      toast.error(
        formatApiError(
          error.response?.data?.detail
        ) || "Failed to delete user."
      );
    }
  };

  /* ==========================================================
    RENDER
  ========================================================== */

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between flex-wrap gap-3">

        <div>
          <h1 className="font-display font-extrabold text-3xl text-[#0a2540]">
            Users
          </h1>

          <p className="text-slate-500 mt-1">
            Manage your organization's internal team and roles.
          </p>
        </div>

        {/* ====================================================
            ADD USER
        ==================================================== */}

        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);

            if (!value) {
              setInviteLink(null);

              /*
               * Reset form when dialog closes.
               */
              setForm({
                first_name: "",
                last_name: "",
                email: "",
                phone: "",
                department: "",
                designation: "",
                role: "organization_admin",
                password: "",
              });
            }
          }}
        >

          <DialogTrigger asChild>

            <Button
              data-testid="add-user-btn"
              className="bg-[#1e5bff] hover:bg-[#154cdb] transition-colors duration-200"
            >
              <UserPlus className="h-4 w-4 mr-2" />

              Add User
            </Button>

          </DialogTrigger>

          <DialogContent className="max-w-lg">

            <DialogHeader>

              <DialogTitle>
                Add User
              </DialogTitle>

            </DialogHeader>

            {/* ==================================================
                INVITATION LINK
            ================================================== */}

            {inviteLink ? (

              <div className="py-4">

                <p className="text-sm text-slate-600 mb-2">
                  User created successfully.
                  Share this link with the user:
                </p>

                <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 p-2 text-xs">

                  <span className="flex-1 break-all text-[#1e5bff]">
                    {inviteLink}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        window.location.origin +
                          inviteLink
                      );

                      toast.success("Copied");
                    }}
                    className="p-1 rounded hover:bg-slate-200"
                  >
                    <Copy className="h-4 w-4 text-slate-500" />
                  </button>

                </div>

                <div className="flex justify-end mt-4">

                  <Button
                    onClick={() => {
                      setInviteLink(null);
                      setOpen(false);
                    }}
                  >
                    Done
                  </Button>

                </div>

              </div>

            ) : (

              /* ==================================================
                  USER FORM
              ================================================== */

              <div className="grid grid-cols-2 gap-3 py-2">

                {/* First Name */}

                <div className="space-y-1">

                  <Label>
                    First Name
                  </Label>

                  <Input
                    data-testid="user-firstname-input"
                    value={form.first_name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        first_name: event.target.value,
                      })
                    }
                    placeholder="John"
                  />

                </div>


                {/* Last Name */}

                <div className="space-y-1">

                  <Label>
                    Last Name
                  </Label>

                  <Input
                    data-testid="user-lastname-input"
                    value={form.last_name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        last_name: event.target.value,
                      })
                    }
                    placeholder="Doe"
                  />

                </div>


                {/* Email */}

                <div className="space-y-1 col-span-2">

                  <Label>
                    Email
                  </Label>

                  <Input
                    data-testid="user-email-input"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        email: event.target.value,
                      })
                    }
                    placeholder="john@example.com"
                  />

                </div>


                {/* Phone */}

                <div className="space-y-1">

                  <Label>
                    Phone
                  </Label>

                  <Input
                    value={form.phone}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        phone: event.target.value,
                      })
                    }
                    placeholder="9876543210"
                  />

                </div>


                {/* Department */}

                <div className="space-y-1">

                  <Label>
                    Department
                  </Label>

                  <Input
                    value={form.department}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        department: event.target.value,
                      })
                    }
                    placeholder="Engineering"
                  />

                </div>


                {/* Designation */}

                <div className="space-y-1">

                  <Label>
                    Designation
                  </Label>

                  <Input
                    value={form.designation}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        designation: event.target.value,
                      })
                    }
                    placeholder="Software Engineer"
                  />

                </div>


                {/* Password */}

                <div className="space-y-1">

                  <Label>
                    Password
                  </Label>

                  <Input
                    data-testid="user-password-input"
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        password: event.target.value,
                      })
                    }
                    placeholder="Enter password"
                  />

                </div>


                {/* Role */}

                <div className="space-y-1 col-span-2">

                  <Label>
                    Role
                  </Label>

                  <Select
                    value={form.role}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        role: value,
                      })
                    }
                  >

                    <SelectTrigger
                      data-testid="user-role-select"
                    >
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>

                    <SelectContent>

                      <SelectItem value="organization_admin">
                        Organization Admin
                      </SelectItem>

                    </SelectContent>

                  </Select>

                </div>

              </div>
            )}

            {/* ==================================================
                FOOTER
            ================================================== */}

            {!inviteLink && (

              <DialogFooter>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  data-testid="create-user-btn"
                  onClick={createUser}
                  disabled={
                    saving ||
                    !form.first_name.trim() ||
                    !form.email.trim() ||
                    !form.password
                  }
                  className="bg-[#1e5bff] hover:bg-[#154cdb]"
                >
                  {saving
                    ? "Creating..."
                    : "Create User"}
                </Button>

              </DialogFooter>

            )}

          </DialogContent>

        </Dialog>

      </div>


      {/* ======================================================
          SEARCH
      ====================================================== */}

      <div className="relative max-w-sm">

        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

        <Input
          data-testid="users-search"
          value={q}
          onChange={(event) =>
            setQ(event.target.value)
          }
          placeholder="Search users..."
          className="pl-9"
        />

      </div>


      {/* ======================================================
          USERS TABLE
      ====================================================== */}

      <Card
        className="border-slate-200 shadow-sm overflow-hidden"
        data-testid="users-table"
      >

        {/* ====================================================
            LOADING
        ==================================================== */}

        {!users ? (

          <TableSkeleton />

        ) : filtered.length === 0 ? (

          /* ==================================================
              EMPTY STATE
          ================================================== */

          <EmptyState
            icon={UsersIcon}
            title={
              q
                ? "No users found"
                : "Add your recruitment team to start collaborating."
            }
            description={
              q
                ? "Try changing your search."
                : "Invite users to your organization."
            }
          />

        ) : (

          /* ==================================================
              TABLE
          ================================================== */

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              {/* =================================================
                  TABLE HEADER
              ================================================= */}

              <thead className="bg-slate-50 text-slate-500">

                <tr className="text-left">

                  {[
                    "Name",
                    "Email",
                    "Phone",
                    "Role",
                    "Department",
                    "Designation",
                    "Status",
                    "Last Login",
                    "",
                  ].map((header) => (

                    <th
                      key={header}
                      className="px-4 py-3 font-semibold text-xs uppercase tracking-wide"
                    >
                      {header}
                    </th>

                  ))}

                </tr>

              </thead>


              {/* =================================================
                  TABLE BODY
              ================================================= */}

              <tbody>

                {filtered.map((user) => {

                  const status = getUserStatus(user);

                  return (

                    <tr
                      key={user.id}
                      className="border-t border-slate-100 hover:bg-slate-50 transition-colors duration-150"
                    >

                      {/* NAME */}

                      <td className="px-4 py-3">

                        <div className="flex items-center gap-2">

                          <Avatar className="h-8 w-8">

                            <AvatarFallback className="bg-[#1e5bff] text-white text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>

                          </Avatar>

                          <span className="font-medium text-[#0a2540]">
                            {user.name || "—"}
                          </span>

                        </div>

                      </td>


                      {/* EMAIL */}

                      <td className="px-4 py-3 text-slate-600">
                        {user.email || "—"}
                      </td>


                      {/* PHONE */}

                      <td className="px-4 py-3 text-slate-600">
                        {user.phone || "—"}
                      </td>


                      {/* ROLE */}

                      <td className="px-4 py-3 text-slate-600">
                        {formatRole(user.role)}
                      </td>


                      {/* DEPARTMENT */}

                      <td className="px-4 py-3 text-slate-600">
                        {user.department || "—"}
                      </td>


                      {/* DESIGNATION */}

                      <td className="px-4 py-3 text-slate-600">
                        {user.designation || "—"}
                      </td>


                      {/* STATUS */}

                      <td className="px-4 py-3">

                        <StatusBadge
                          status={status}
                        />

                      </td>


                      {/* LAST LOGIN */}

                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {formatDate(user.last_login)}
                      </td>


                      {/* ACTIONS */}

                      <td className="px-4 py-3">

                        <DropdownMenu>

                          <DropdownMenuTrigger asChild>

                            <button
                              type="button"
                              data-testid={`user-actions-${user.id}`}
                              className="h-8 w-8 rounded flex items-center justify-center hover:bg-slate-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>

                          </DropdownMenuTrigger>


                          <DropdownMenuContent align="end">

                            {/* Activate / Deactivate */}

                            <DropdownMenuItem
                              onClick={() =>
                                toggleStatus(user)
                              }
                            >
                              {user.is_active
                                ? "Deactivate"
                                : "Activate"}
                            </DropdownMenuItem>


                            {/* Reset Password */}

                            <DropdownMenuItem
                              onClick={() =>
                                resetPw(user)
                              }
                            >
                              Reset Password
                            </DropdownMenuItem>


                            {/* Delete */}

                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() =>
                                removeUser(user)
                              }
                            >
                              Delete
                            </DropdownMenuItem>

                          </DropdownMenuContent>

                        </DropdownMenu>

                      </td>

                    </tr>

                  );
                })}

              </tbody>

            </table>

          </div>

        )}

      </Card>

    </div>
  );
}