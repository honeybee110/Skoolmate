import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RoleGate } from "@/components/role-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  UserCog, Upload, Search, Loader2, ImageIcon, Trash2, User, Users,
} from "lucide-react";
import {
  listProfilePhotos, upsertProfilePhoto, signProfilePhoto, deleteProfilePhoto,
  type ProfilePhoto, type SubjectType,
} from "@/lib/profile-photos.functions";
import { supabase } from "@/integrations/supabase/client";
import { students } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "User & Photo Management · skoolmate" }] }),
  component: () => (
    <RoleGate groups={["it", "leadership"]}>
      <UserPhotoManagement />
    </RoleGate>
  ),
});

// Seed staff roster (skoolmate demo). Real staff would come from a directory.
const STAFF: { id: string; name: string; role: string }[] = [
  { id: "staff-honey", name: "Honey Cruz", role: "Classroom Teacher · P7" },
  { id: "staff-priya", name: "Priya Patel", role: "Classroom Teacher · P6" },
  { id: "staff-marc", name: "Marc Adebayo", role: "Classroom Teacher · P5" },
  { id: "staff-lena", name: "Lena Brooks", role: "Learning Specialist" },
  { id: "staff-ari", name: "Ari Thompson", role: "Principal" },
  { id: "staff-callum", name: "Callum Reid", role: "Assistant Principal" },
  { id: "staff-shanti", name: "Shanti Rao", role: "OT" },
  { id: "staff-jem", name: "Jem Ok", role: "IT Admin" },
];

interface Row {
  subject_type: SubjectType;
  subject_id: string;
  display_name: string;
  role_or_year: string;
  photo?: ProfilePhoto;
}

function UserPhotoManagement() {
  const listFn = useServerFn(listProfilePhotos);
  const upsertFn = useServerFn(upsertProfilePhoto);
  const signFn = useServerFn(signProfilePhoto);
  const delFn = useServerFn(deleteProfilePhoto);
  const qc = useQueryClient();

  const query = useQuery({ queryKey: ["profile-photos"], queryFn: () => listFn() });
  const photos = query.data ?? [];
  const photoBy = useMemo(() => {
    const m = new Map<string, ProfilePhoto>();
    for (const p of photos) m.set(`${p.subject_type}:${p.subject_id}`, p);
    return m;
  }, [photos]);

  const [tab, setTab] = useState<SubjectType>("student");
  const [q, setQ] = useState("");

  const studentRows: Row[] = students.map((s) => ({
    subject_type: "student",
    subject_id: s.id,
    display_name: `${s.firstName} ${s.lastName}`,
    role_or_year: `${s.yearLevel} · ${s.className}`,
    photo: photoBy.get(`student:${s.id}`),
  }));
  const staffRows: Row[] = STAFF.map((s) => ({
    subject_type: "staff",
    subject_id: s.id,
    display_name: s.name,
    role_or_year: s.role,
    photo: photoBy.get(`staff:${s.id}`),
  }));

  const rows = (tab === "student" ? studentRows : staffRows).filter((r) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return `${r.display_name} ${r.role_or_year}`.toLowerCase().includes(s);
  });

  const del = useMutation({
    mutationFn: (v: { id: string; path: string }) => delFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile-photos"] }); toast.success("Photo removed."); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell variant="admin">
      <PageHeader
        title="User & Photo Management"
        subtitle="IT and leadership manage staff and student profile photos on file."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <UserCog className="h-3.5 w-3.5" />
              {photos.filter((p) => p.subject_type === "student").length} student · {photos.filter((p) => p.subject_type === "staff").length} staff photos
            </Badge>
          </div>
        }
      />

      <div className="px-4 py-6 md:px-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as SubjectType)}>
            <TabsList>
              <TabsTrigger value="student" className="gap-2"><Users className="h-4 w-4" />Students</TabsTrigger>
              <TabsTrigger value="staff" className="gap-2"><User className="h-4 w-4" />Staff</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or class/role…" className="h-9 pl-8" />
          </div>
        </div>

        {query.isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />Loading photos…
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {rows.map((r) => (
            <PhotoTile
              key={`${r.subject_type}:${r.subject_id}`}
              row={r}
              onUpload={async (file) => {
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) throw new Error("Please sign in.");
                  const path = `${r.subject_type}/${r.subject_id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
                  const { error } = await supabase.storage.from("profile-photos").upload(path, file, {
                    contentType: file.type || "image/jpeg", upsert: true,
                  });
                  if (error) throw new Error(error.message);
                  await upsertFn({ data: {
                    subject_type: r.subject_type, subject_id: r.subject_id,
                    display_name: r.display_name, role_or_year: r.role_or_year,
                    storage_path: path, content_type: file.type, size_bytes: file.size,
                  }});
                  qc.invalidateQueries({ queryKey: ["profile-photos"] });
                  toast.success(`Photo saved for ${r.display_name}.`);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Upload failed");
                }
              }}
              onDelete={() => r.photo && del.mutate({ id: r.photo.id, path: r.photo.storage_path })}
              signFn={signFn}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function PhotoTile({ row, onUpload, onDelete, signFn }: {
  row: Row;
  onUpload: (f: File) => void;
  onDelete: () => void;
  signFn: (v: { data: { path: string } }) => Promise<{ url: string }>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useMemo(() => {
    let cancelled = false;
    (async () => {
      if (!row.photo) { setUrl(null); return; }
      try {
        const { url: u } = await signFn({ data: { path: row.photo.storage_path } });
        if (!cancelled) setUrl(u);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [row.photo, signFn]);

  return (
    <Card className="overflow-hidden">
      <div className={cn("relative aspect-square bg-muted flex items-center justify-center", !url && "text-muted-foreground")}>
        {url ? (
          <img src={url} alt={row.display_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-xs">
            <ImageIcon className="h-6 w-6" />
            No photo
          </div>
        )}
      </div>
      <div className="p-2 space-y-1">
        <p className="text-xs font-semibold truncate">{row.display_name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{row.role_or_year}</p>
        <div className="flex gap-1 pt-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setUploading(true);
              await onUpload(f);
              setUploading(false);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <Button size="sm" variant="outline" className="h-7 flex-1 text-[11px]" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {row.photo ? "Replace" : "Upload"}
          </Button>
          {row.photo && (
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
