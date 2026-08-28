import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/role-gate";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  listAuditEvents, verifyAuditChain,
  type AuditEvent, type AuditChainStatus,
} from "@/lib/audit-log";
import {
  ShieldCheck, ShieldAlert, Lock, Loader2, RefreshCw, Search, Link2,
} from "lucide-react";

export const Route = createFileRoute("/admin/audit-trail")({
  head: () => ({
    meta: [
      { title: "Immutable audit trail · skoolmate" },
      { name: "description", content: "Tamper-evident, append-only record of every action taken in SkoolMate." },
      { property: "og:title", content: "Immutable audit trail · skoolmate" },
      { property: "og:description", content: "Tamper-evident, append-only record of every action taken in SkoolMate." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuditTrailPage,
});

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function AuditTrailPage() {
  const [rows, setRows] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chain, setChain] = useState<AuditChainStatus | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [q, setQ] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listAuditEvents(300));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load the audit trail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const runVerify = async () => {
    setVerifying(true);
    try {
      setChain(await verifyAuditChain());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const entityTypes = useMemo(
    () => Array.from(new Set(rows.map((r) => r.entity_type))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (entityFilter !== "all" && r.entity_type !== entityFilter) return false;
      if (!needle) return true;
      return [r.action, r.entity_type, r.entity_id, r.summary, r.actor_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [rows, q, entityFilter]);

  return (
    <AppShell>
      <PageHeader
        title="Immutable audit trail"
        subtitle="Append-only, hash-chained record of every logged action — entries can never be edited or deleted."
        actions={
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      <div className="space-y-5 px-4 py-6 md:px-8">
        <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-primary" />
            <span className="font-medium">Write-once storage</span>
            <Badge variant="outline" className="font-normal">{rows.length} entries</Badge>
            {chain && (
              chain.ok ? (
                <Badge className="gap-1 bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="h-3 w-3" /> Chain verified ({chain.total})
                </Badge>
              ) : (
                <Badge className="gap-1 bg-destructive/10 text-destructive">
                  <ShieldAlert className="h-3 w-3" /> {chain.invalid} tampered from #{chain.first_invalid_seq}
                </Badge>
              )
            )}
          </div>
          <Button size="sm" onClick={() => void runVerify()} disabled={verifying} className="gap-1.5">
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Verify integrity
          </Button>
        </Card>

        <Card className="grid gap-3 p-4 md:grid-cols-[1fr_220px]">
          <div className="space-y-1">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-9 pl-8"
                placeholder="Action, record, person…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Record type</Label>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {entityTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {error && (
          <Card className="flex items-start gap-3 border-destructive/30 bg-destructive/5 p-4 text-sm">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-destructive" />
            <div>
              <div className="font-medium text-destructive">Unable to show the audit trail</div>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </Card>
        )}

        {loading ? (
          <Card className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading audit trail…
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">No audit entries yet.</Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline" className="font-mono text-[11px]">#{r.seq}</Badge>
                  <span className="font-medium">{r.action}</span>
                  <Badge className="bg-secondary text-secondary-foreground">{r.entity_type}</Badge>
                  {r.entity_id && (
                    <span className="font-mono text-xs text-muted-foreground">{r.entity_id}</span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">{fmt(r.created_at)}</span>
                </div>
                {r.summary && <p className="mt-1.5 text-sm text-muted-foreground">{r.summary}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{r.actor_name ?? "Unknown user"}{r.actor_role ? ` · ${r.actor_role}` : ""}</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Link2 className="h-3 w-3" />
                    {r.hash.slice(0, 12)}…
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
