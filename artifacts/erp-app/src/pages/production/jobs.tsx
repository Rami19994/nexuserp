import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Factory, Plus, Loader2, ChevronRight, CheckCircle2,
  Truck, Package, ShoppingCart, Cog, ArrowRight,
  FileText, Trash2, ClipboardList, Send
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────
interface ProductionLine { id: number; lineCode: string; lineName: string; lineType: string; isActive: boolean; }

interface ProductionJob {
  id: number; docNumber: string; productCode: string; productName: string | null;
  plannedQty: string; status: string; createdAt: string;
  assemblyLineId: number | null; packagingLineId: number | null;
  assemblyLine: ProductionLine | null; packagingLine: ProductionLine | null;
  issuedAt: string | null; issuedNotes: string | null;
  assembledQty: string | null; assembledAt: string | null; assemblyNotes: string | null;
  packagingSentAt: string | null; packagingSentNotes: string | null;
  packagedQty: string | null; packagedAt: string | null; packagingNotes: string | null;
  dispatchedQty: string | null; dispatchedAt: string | null;
  customer: string | null; dispatchNotes: string | null; notes: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────
const STAGES = [
  { key: "draft",      label: "Draft",             icon: FileText,     color: "text-muted-foreground", bg: "bg-muted/40" },
  { key: "issued",     label: "Issued to Assembly", icon: Send,         color: "text-blue-400",         bg: "bg-blue-500/10" },
  { key: "assembled",  label: "Received Assembly",  icon: Cog,          color: "text-indigo-400",       bg: "bg-indigo-500/10" },
  { key: "packaging",  label: "In Packaging",       icon: Package,      color: "text-amber-400",        bg: "bg-amber-500/10" },
  { key: "packaged",   label: "Packaging Done",     icon: CheckCircle2, color: "text-teal-400",         bg: "bg-teal-500/10" },
  { key: "dispatched", label: "Dispatched",         icon: ShoppingCart, color: "text-emerald-400",      bg: "bg-emerald-500/10" },
];

// ── Helpers ────────────────────────────────────────────────────────────
const api = (url: string, method = "GET", body?: unknown) =>
  fetch(url, {
    method, credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.ok ? r.json() : r.json().then((e: any) => Promise.reject(e)));

function StatusBadge({ status }: { status: string }) {
  const s = STAGES.find(s => s.key === status) || STAGES[0];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.color} border border-current/20`}>
      <Icon className="h-3 w-3" /> {s.label}
    </span>
  );
}

function StageTimeline({ job }: { job: ProductionJob }) {
  const stageIdx = STAGES.findIndex(s => s.key === job.status);
  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {STAGES.map((s, i) => {
        const done = i <= stageIdx;
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex items-center gap-0.5">
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold uppercase tracking-wide transition-colors
              ${done ? `${s.bg} ${s.color}` : "bg-muted/20 text-muted-foreground/40"}`}>
              <Icon className="h-2.5 w-2.5" /> {s.label}
            </div>
            {i < STAGES.length - 1 && (
              <ArrowRight className={`h-2.5 w-2.5 ${done && i < stageIdx ? s.color : "text-muted-foreground/20"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Stage Action Dialogs ───────────────────────────────────────────────
function StageActionPanel({
  job, lines, onSuccess,
}: { job: ProductionJob; lines: ProductionLine[]; onSuccess: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assembledQty, setAssembledQty] = useState(job.plannedQty || "");
  const [packagedQty, setPackagedQty] = useState("");
  const [dispatchedQty, setDispatchedQty] = useState("");
  const [packagingLineId, setPackagingLineId] = useState(job.packagingLineId?.toString() || "");
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");

  const doAction = async (endpoint: string, body: Record<string, unknown>) => {
    setLoading(true);
    try {
      await api(`/api/production-jobs/${job.id}/${endpoint}`, "POST", body);
      toast({ title: "Updated", description: "Production job progressed to next stage." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.error || "Action failed." });
    } finally { setLoading(false); }
  };

  const packagingLines = lines.filter(l => l.lineType === "packaging" && l.isActive);

  if (job.status === "draft") {
    return (
      <div className="space-y-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
        <h4 className="font-semibold text-blue-400 flex items-center gap-2"><Send className="h-4 w-4" /> Stage 1: Issue to Assembly Line</h4>
        <p className="text-xs text-muted-foreground">Release materials to <strong>{job.assemblyLine?.lineName || "assembly line"}</strong> to begin production.</p>
        <Textarea placeholder="Notes (optional)..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-background text-sm min-h-[70px]" />
        <Button onClick={() => doAction("issue", { notes })} disabled={loading} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Issue to {job.assemblyLine?.lineCode || "Assembly"}
        </Button>
      </div>
    );
  }

  if (job.status === "issued") {
    return (
      <div className="space-y-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
        <h4 className="font-semibold text-indigo-400 flex items-center gap-2"><Cog className="h-4 w-4" /> Stage 2: Receive from Assembly</h4>
        <p className="text-xs text-muted-foreground">Record finished goods received from <strong>{job.assemblyLine?.lineName}</strong>. Planned: <strong>{job.plannedQty}</strong></p>
        <div className="flex gap-3 items-end">
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Quantity Received</Label>
            <Input type="number" min="0.001" step="0.001" value={assembledQty} onChange={e => setAssembledQty(e.target.value)} className="bg-background" />
          </div>
        </div>
        <Textarea placeholder="Notes (optional)..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-background text-sm min-h-[70px]" />
        <Button onClick={() => doAction("receive-assembly", { assembledQty: parseFloat(assembledQty), notes })} disabled={loading || !assembledQty}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Confirm Assembly Receipt
        </Button>
      </div>
    );
  }

  if (job.status === "assembled") {
    return (
      <div className="space-y-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <h4 className="font-semibold text-amber-400 flex items-center gap-2"><Package className="h-4 w-4" /> Stage 3: Send to Packaging Line</h4>
        <p className="text-xs text-muted-foreground">Assembled qty: <strong>{job.assembledQty}</strong>. Send to packaging for final packaging.</p>
        {packagingLines.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs">Packaging Line</Label>
            <Select value={packagingLineId} onValueChange={setPackagingLineId}>
              <SelectTrigger className="bg-background text-sm"><SelectValue placeholder="Select packaging line..." /></SelectTrigger>
              <SelectContent>
                {packagingLines.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.lineCode} — {l.lineName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <Textarea placeholder="Notes (optional)..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-background text-sm min-h-[70px]" />
        <Button onClick={() => doAction("send-packaging", { packagingLineId: packagingLineId || null, notes })} disabled={loading}
          className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
          Send to Packaging
        </Button>
      </div>
    );
  }

  if (job.status === "packaging") {
    const lineLabel = lines.find(l => l.id === job.packagingLineId)?.lineName || "packaging line";
    return (
      <div className="space-y-3 p-4 rounded-xl bg-teal-500/5 border border-teal-500/20">
        <h4 className="font-semibold text-teal-400 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Stage 4: Receive from Packaging</h4>
        <p className="text-xs text-muted-foreground">Record packaged goods received from <strong>{lineLabel}</strong>. Assembled: <strong>{job.assembledQty}</strong></p>
        <div className="space-y-1">
          <Label className="text-xs">Packaged Quantity Received</Label>
          <Input type="number" min="0.001" step="0.001" value={packagedQty} onChange={e => setPackagedQty(e.target.value)} className="bg-background" placeholder={job.assembledQty || ""} />
        </div>
        <Textarea placeholder="Notes (optional)..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-background text-sm min-h-[70px]" />
        <Button onClick={() => doAction("receive-packaging", { packagedQty: parseFloat(packagedQty), notes })} disabled={loading || !packagedQty}
          className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Confirm Packaging Receipt
        </Button>
      </div>
    );
  }

  if (job.status === "packaged") {
    return (
      <div className="space-y-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
        <h4 className="font-semibold text-emerald-400 flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Stage 5: Dispatch to Market</h4>
        <p className="text-xs text-muted-foreground">Packaged: <strong>{job.packagedQty}</strong> units ready for sale/dispatch.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Dispatch Quantity</Label>
            <Input type="number" min="0.001" step="0.001" value={dispatchedQty} onChange={e => setDispatchedQty(e.target.value)} className="bg-background" placeholder={job.packagedQty || ""} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Customer / Destination</Label>
            <Input value={customer} onChange={e => setCustomer(e.target.value)} className="bg-background" placeholder="Customer name or market..." />
          </div>
        </div>
        <Textarea placeholder="Dispatch notes (optional)..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-background text-sm min-h-[70px]" />
        <Button onClick={() => doAction("dispatch", { dispatchedQty: parseFloat(dispatchedQty), customer, notes })} disabled={loading || !dispatchedQty}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
          Dispatch to Market
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400">
      <CheckCircle2 className="h-5 w-5 shrink-0" />
      <div>
        <div className="font-semibold">Production Complete</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Dispatched <strong>{job.dispatchedQty}</strong> to <strong>{job.customer || "market"}</strong>.{" "}
          {job.dispatchedAt && format(new Date(job.dispatchedAt), "dd MMM yyyy HH:mm")}
        </div>
      </div>
    </div>
  );
}

// ── Job Card ───────────────────────────────────────────────────────────
function JobCard({ job, lines, onRefresh }: { job: ProductionJob; lines: ProductionLine[]; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirm(`Delete job ${job.docNumber}?`)) return;
    try {
      await api(`/api/production-jobs/${job.id}`, "DELETE");
      toast({ title: "Job deleted" });
      onRefresh();
    } catch (err: any) { toast({ variant: "destructive", title: "Error", description: err.error }); }
  };

  const stageIdx = STAGES.findIndex(s => s.key === job.status);
  const progress = Math.round((stageIdx / (STAGES.length - 1)) * 100);

  return (
    <div className="premium-card overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-primary text-sm">{job.docNumber}</span>
              <StatusBadge status={job.status} />
            </div>
            <div className="mt-1">
              <span className="font-semibold text-foreground">{job.productCode}</span>
              {job.productName && <span className="text-muted-foreground ml-2 text-sm">{job.productName}</span>}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              <span>Planned: <strong className="text-foreground">{parseFloat(job.plannedQty).toLocaleString()}</strong> units</span>
              {job.assemblyLine && <span>Assembly: <strong className="text-foreground">{job.assemblyLine.lineCode}</strong></span>}
              {job.packagingLine && <span>Packaging: <strong className="text-foreground">{job.packagingLine.lineCode}</strong></span>}
              <span>{format(new Date(job.createdAt), "dd MMM yyyy")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {job.status === "draft" && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={e => { e.stopPropagation(); handleDelete(); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="mt-2 hidden sm:block">
          <StageTimeline job={job} />
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border p-4 sm:p-5 space-y-4 bg-muted/10">
          {/* Stage history */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {job.issuedAt && (
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                <div className="font-semibold text-blue-400 mb-1 flex items-center gap-1"><Send className="h-3 w-3" /> Issued to Assembly</div>
                <div className="text-muted-foreground">{format(new Date(job.issuedAt), "dd MMM yyyy HH:mm")}</div>
                <div className="text-foreground">Line: {job.assemblyLine?.lineName}</div>
                {job.issuedNotes && <div className="mt-1 italic text-muted-foreground">{job.issuedNotes}</div>}
              </div>
            )}
            {job.assembledAt && (
              <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3">
                <div className="font-semibold text-indigo-400 mb-1 flex items-center gap-1"><Cog className="h-3 w-3" /> Received from Assembly</div>
                <div className="text-muted-foreground">{format(new Date(job.assembledAt), "dd MMM yyyy HH:mm")}</div>
                <div className="text-foreground font-mono font-bold">{parseFloat(job.assembledQty || "0").toLocaleString()} units received</div>
                {job.assemblyNotes && <div className="mt-1 italic text-muted-foreground">{job.assemblyNotes}</div>}
              </div>
            )}
            {job.packagingSentAt && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <div className="font-semibold text-amber-400 mb-1 flex items-center gap-1"><Truck className="h-3 w-3" /> Sent to Packaging</div>
                <div className="text-muted-foreground">{format(new Date(job.packagingSentAt), "dd MMM yyyy HH:mm")}</div>
                <div className="text-foreground">Line: {lines.find(l => l.id === job.packagingLineId)?.lineName || "—"}</div>
                {job.packagingSentNotes && <div className="mt-1 italic text-muted-foreground">{job.packagingSentNotes}</div>}
              </div>
            )}
            {job.packagedAt && (
              <div className="rounded-lg bg-teal-500/10 border border-teal-500/20 p-3">
                <div className="font-semibold text-teal-400 mb-1 flex items-center gap-1"><Package className="h-3 w-3" /> Received from Packaging</div>
                <div className="text-muted-foreground">{format(new Date(job.packagedAt), "dd MMM yyyy HH:mm")}</div>
                <div className="text-foreground font-mono font-bold">{parseFloat(job.packagedQty || "0").toLocaleString()} units packaged</div>
                {job.packagingNotes && <div className="mt-1 italic text-muted-foreground">{job.packagingNotes}</div>}
              </div>
            )}
            {job.dispatchedAt && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> Dispatched</div>
                <div className="text-muted-foreground">{format(new Date(job.dispatchedAt), "dd MMM yyyy HH:mm")}</div>
                <div className="text-foreground font-mono font-bold">{parseFloat(job.dispatchedQty || "0").toLocaleString()} units → {job.customer || "Market"}</div>
                {job.dispatchNotes && <div className="mt-1 italic text-muted-foreground">{job.dispatchNotes}</div>}
              </div>
            )}
          </div>

          {/* Next action panel */}
          {job.status !== "dispatched" && (
            <StageActionPanel job={job} lines={lines} onSuccess={onRefresh} />
          )}
        </div>
      )}
    </div>
  );
}

// ── New Job Form ───────────────────────────────────────────────────────
function NewJobForm({ lines, onSuccess }: { lines: ProductionLine[]; onSuccess: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [plannedQty, setPlannedQty] = useState("100");
  const [assemblyLineId, setAssemblyLineId] = useState("");
  const [packagingLineId, setPackagingLineId] = useState("");
  const [notes, setNotes] = useState("");

  const assemblyLines  = lines.filter(l => l.lineType === "assembly"  && l.isActive);
  const packagingLines = lines.filter(l => l.lineType === "packaging" && l.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const job = await api("/api/production-jobs", "POST", {
        productCode, productName, plannedQty: parseFloat(plannedQty),
        assemblyLineId: parseInt(assemblyLineId),
        packagingLineId: packagingLineId ? parseInt(packagingLineId) : null,
        notes,
      });
      toast({ title: `Job created: ${job.docNumber}`, description: "Now issue it to the assembly line." });
      setProductCode(""); setProductName(""); setPlannedQty("100");
      setAssemblyLineId(""); setPackagingLineId(""); setNotes("");
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.error || "Could not create job." });
    } finally { setLoading(false); }
  };

  return (
    <div className="premium-card p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Plus className="h-5 w-5 text-primary" /> Create New Production Job
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Product Code <span className="text-destructive">*</span></Label>
            <Input value={productCode} onChange={e => setProductCode(e.target.value.toUpperCase())} className="h-11 bg-background font-mono" placeholder="e.g. PAD11" required />
          </div>
          <div className="space-y-2">
            <Label>Product Name</Label>
            <Input value={productName} onChange={e => setProductName(e.target.value)} className="h-11 bg-background" placeholder="e.g. Tablet PAD-11" />
          </div>
          <div className="space-y-2">
            <Label>Planned Quantity <span className="text-destructive">*</span></Label>
            <Input type="number" min="1" step="1" value={plannedQty} onChange={e => setPlannedQty(e.target.value)} className="h-11 bg-background font-mono" required />
          </div>
          <div className="space-y-2">
            <Label>Assembly Line <span className="text-destructive">*</span></Label>
            <Select value={assemblyLineId} onValueChange={setAssemblyLineId} required>
              <SelectTrigger className="h-11 bg-background"><SelectValue placeholder="Select assembly line..." /></SelectTrigger>
              <SelectContent>
                {assemblyLines.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.lineCode} — {l.lineName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Packaging Line <span className="text-muted-foreground text-xs">(optional — can set later)</span></Label>
            <Select value={packagingLineId} onValueChange={setPackagingLineId}>
              <SelectTrigger className="h-11 bg-background"><SelectValue placeholder="Select packaging line..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None for now —</SelectItem>
                {packagingLines.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.lineCode} — {l.lineName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="bg-background min-h-[80px]" placeholder="Any additional details..." />
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">📋 What happens next</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {["Create Job (WO-…)", "Issue to Assembly", "Receive from Assembly", "Send to Packaging", "Receive from Packaging", "Dispatch to Market"].map((s, i) => (
              <span key={s} className="flex items-center gap-1 text-xs">
                <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                {s}
                {i < 5 && <ArrowRight className="h-3 w-3 text-muted-foreground/40" />}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading || !productCode || !assemblyLineId} size="lg"
            className="gap-2 min-w-[200px] shadow-lg shadow-primary/20">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            Create Production Job
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Lines Management ──────────────────────────────────────────────────
function LinesPanel({ lines, onRefresh }: { lines: ProductionLine[]; onRefresh: () => void }) {
  const { toast } = useToast();
  const [code, setCode] = useState(""); const [name, setName] = useState(""); const [type, setType] = useState("assembly");
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await api("/api/production-lines", "POST", { lineCode: code.toUpperCase(), lineName: name, lineType: type });
      toast({ title: "Line added" }); setCode(""); setName("");
      onRefresh();
    } catch (err: any) { toast({ variant: "destructive", title: "Error", description: err.error }); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this line?")) return;
    try { await api(`/api/production-lines/${id}`, "DELETE"); toast({ title: "Deleted" }); onRefresh(); }
    catch (err: any) { toast({ variant: "destructive", title: "Error", description: err.error }); }
  };

  return (
    <div className="space-y-6">
      <div className="premium-card p-6">
        <h2 className="text-xl font-semibold mb-4">Add Production Line</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-1"><Label className="text-xs">Line Code</Label>
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="A01" className="bg-background font-mono" required /></div>
          <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Line Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Assembly Line A01" className="bg-background" required /></div>
          <div className="space-y-1"><Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="assembly">Assembly</SelectItem><SelectItem value="packaging">Packaging</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading} className="sm:col-span-4 gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Line
          </Button>
        </form>
      </div>

      <div className="premium-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Code</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Name</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Type</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lines.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">No production lines configured.</td></tr>
            ) : lines.map(l => (
              <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-primary">{l.lineCode}</td>
                <td className="px-4 py-3">{l.lineName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${l.lineType === "assembly" ? "bg-blue-500/20 text-blue-400" : l.lineType === "packaging" ? "bg-amber-500/20 text-amber-400" : "bg-muted text-muted-foreground"}`}>
                    {l.lineType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${l.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                    {l.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(l.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function ProductionJobsPage() {
  const qc = useQueryClient();

  const { data: lines = [], isLoading: linesLoading } = useQuery<ProductionLine[]>({
    queryKey: ["production-lines"],
    queryFn: () => api("/api/production-lines"),
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<ProductionJob[]>({
    queryKey: ["production-jobs"],
    queryFn: () => api("/api/production-jobs"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["production-jobs"] });

  const activeJobs     = jobs.filter(j => j.status !== "dispatched");
  const completedJobs  = jobs.filter(j => j.status === "dispatched");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page header */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl">
          <Factory className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Production Jobs</h1>
          <p className="text-muted-foreground mt-1">Track production from assembly line through packaging to market dispatch.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map(s => {
          const count = jobs.filter(j => j.status === s.key).length;
          const Icon = s.icon;
          return (
            <div key={s.key} className={`rounded-xl border border-border p-3 text-center ${count > 0 ? s.bg : "bg-muted/20"}`}>
              <Icon className={`h-5 w-5 mx-auto mb-1 ${count > 0 ? s.color : "text-muted-foreground/30"}`} />
              <div className={`text-xl font-bold ${count > 0 ? s.color : "text-muted-foreground/40"}`}>{count}</div>
              <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      <Tabs defaultValue="active">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="active" className="gap-2"><ClipboardList className="h-4 w-4" /> Active ({activeJobs.length})</TabsTrigger>
          <TabsTrigger value="new" className="gap-2"><Plus className="h-4 w-4" /> New Job</TabsTrigger>
          <TabsTrigger value="lines" className="gap-2"><Factory className="h-4 w-4" /> Lines</TabsTrigger>
        </TabsList>

        {/* Active Jobs */}
        <TabsContent value="active" className="space-y-4">
          {jobsLoading && <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
          {!jobsLoading && activeJobs.length === 0 && (
            <div className="premium-card p-12 text-center text-muted-foreground">
              <Factory className="h-16 w-16 mx-auto mb-3 opacity-20" />
              <p className="text-lg">No active production jobs.</p>
              <p className="text-sm mt-1">Create a new job to get started.</p>
            </div>
          )}
          {activeJobs.map(job => <JobCard key={job.id} job={job} lines={lines} onRefresh={refresh} />)}

          {completedJobs.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Completed ({completedJobs.length})
              </h3>
              <div className="space-y-3">
                {completedJobs.map(job => <JobCard key={job.id} job={job} lines={lines} onRefresh={refresh} />)}
              </div>
            </div>
          )}
        </TabsContent>

        {/* New Job */}
        <TabsContent value="new">
          <NewJobForm lines={lines} onSuccess={() => { refresh(); }} />
        </TabsContent>

        {/* Lines Management */}
        <TabsContent value="lines">
          <LinesPanel lines={lines} onRefresh={() => qc.invalidateQueries({ queryKey: ["production-lines"] })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
