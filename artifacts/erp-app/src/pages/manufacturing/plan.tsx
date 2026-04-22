import { useState } from "react";
import { useListProducts, useListLocations, useCalculateManufacturingPlan } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManufacturingPlanResult } from "@workspace/api-client-react/src/generated/api.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Factory, Calculator, Loader2, AlertTriangle, CheckCircle,
  Printer, Save, ShieldCheck, ClipboardList, Badge as BadgeIcon,
  FileText, Trash2, CalendarDays, User
} from "lucide-react";
import { format } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────
interface SavedPlan {
  id: number;
  docNumber: string;
  productCode: string;
  productName: string | null;
  targetQty: string;
  locationLabel: string | null;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  notes: string | null;
  items: any[];
  createdBy: { id: number; username: string; fullName: string | null } | null;
}

// ── API helpers ────────────────────────────────────────────────────────
const apiPost = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) })
    .then(r => { if (!r.ok) return r.json().then(e => Promise.reject(e)); return r.json(); });

const apiDelete = (url: string) =>
  fetch(url, { method: "DELETE", credentials: "include" })
    .then(r => { if (!r.ok) return r.json().then(e => Promise.reject(e)); return r.json(); });

// ── Status badge ───────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><ShieldCheck className="h-3 w-3" /> Approved</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30"><FileText className="h-3 w-3" /> Draft</span>;
}

export default function ManufacturingPlanPage() {
  const { data: products } = useListProducts();
  const { data: locations } = useListLocations();
  const calcMutation = useCalculateManufacturingPlan();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Calc form
  const [productCode, setProductCode] = useState("");
  const [targetQty, setTargetQty] = useState("10");
  const [locationId, setLocationId] = useState("all");
  const [locationLabel, setLocationLabel] = useState("All Locations");
  const [planResult, setPlanResult] = useState<ManufacturingPlanResult | null>(null);

  // Save state
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const hasShortages = planResult?.items.some(i => i.shortageQty > 0);

  // Saved plans list
  const { data: savedPlans, isLoading: loadingPlans } = useQuery<SavedPlan[]>({
    queryKey: ["manufacturing-plans"],
    queryFn: () => fetch("/api/manufacturing-plans", { credentials: "include" }).then(r => r.json()),
  });

  // ── Calculate ──────────────────────────────────────────────────────
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productCode) return;
    setSavedPlan(null);
    try {
      const result = await calcMutation.mutateAsync({
        data: {
          productCode,
          targetQty: parseFloat(targetQty),
          locationId: locationId === "all" ? null : parseInt(locationId),
        },
      });
      setPlanResult(result);
    } catch (error) {
      console.error(error);
    }
  };

  // ── Save plan ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!planResult) return;
    setIsSaving(true);
    try {
      const plan = await apiPost("/api/manufacturing-plans", {
        productCode: planResult.productCode,
        productName: planResult.productName,
        targetQty: planResult.targetQty,
        locationId: locationId === "all" ? null : parseInt(locationId),
        locationLabel,
        items: planResult.items,
      });
      setSavedPlan(plan);
      queryClient.invalidateQueries({ queryKey: ["manufacturing-plans"] });
      toast({ title: `Plan saved`, description: `Document: ${plan.docNumber}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save failed", description: err.error || "Could not save plan." });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Approve plan ───────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!savedPlan) return;
    setIsApproving(true);
    try {
      const updated = await apiPost(`/api/manufacturing-plans/${savedPlan.id}/approve`, {});
      setSavedPlan(updated);
      queryClient.invalidateQueries({ queryKey: ["manufacturing-plans"] });
      toast({ title: `Plan approved`, description: `${updated.docNumber} is now approved.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Approval failed", description: err.error || "Could not approve plan." });
    } finally {
      setIsApproving(false);
    }
  };

  // ── Delete plan ────────────────────────────────────────────────────
  const handleDelete = async (id: number, docNumber: string) => {
    if (!confirm(`Delete plan ${docNumber}?`)) return;
    try {
      await apiDelete(`/api/manufacturing-plans/${id}`);
      queryClient.invalidateQueries({ queryKey: ["manufacturing-plans"] });
      toast({ title: "Plan deleted" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete failed", description: err.error || "Could not delete." });
    }
  };

  // ── Print ──────────────────────────────────────────────────────────
  const handlePrint = (plan: ManufacturingPlanResult | null, doc?: SavedPlan | null) => {
    const pr = plan;
    if (!pr) return;

    const docNumber = doc?.docNumber || "DRAFT";
    const statusLabel = doc?.status === "approved" ? "APPROVED" : "DRAFT";
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    const statusHtml = hasShortages
      ? `<div class="status shortage">⚠ SHORTAGE ALERT — Cannot fully fulfill plan with current inventory</div>`
      : `<div class="status ok">✔ SUFFICIENT INVENTORY — All materials available for production</div>`;

    const rowsHtml = pr.items.map((item: any, i: number) => `
      <tr class="${i % 2 === 0 ? "even" : ""}">
        <td>${i + 1}</td>
        <td><strong>${item.materialCode}</strong><br/><span class="sub">${item.materialName}</span></td>
        <td class="num">${item.qtyPerUnit}</td>
        <td class="num bold">${item.requiredQty}</td>
        <td class="num">${item.availableQty}</td>
        <td class="num ${item.shortageQty > 0 ? "shortage-cell" : "ok-cell"}">${item.shortageQty > 0 ? item.shortageQty : "—"}</td>
        <td class="remark"></td>
      </tr>`).join("");

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>${docNumber}</title>
<style>
  @page { size: A4 landscape; margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #1a1a2e; margin:0; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #1a237e; padding-bottom:10px; margin-bottom:14px; }
  .logo-area h1 { font-size:20pt; font-weight:900; color:#1a237e; margin:0; }
  .logo-area p  { font-size:8pt; color:#666; margin:2px 0 0; }
  .doc-title { text-align:right; }
  .doc-title h2 { font-size:15pt; font-weight:700; color:#1a237e; margin:0; }
  .doc-title .ref { font-size:8pt; color:#888; margin-top:4px; }
  .doc-num { font-size:11pt; font-family:"Courier New",monospace; color:#1a237e; font-weight:700; }
  .status-badge { display:inline-block; padding:2px 10px; border-radius:12px; font-size:8pt; font-weight:700; margin-left:8px;
    ${doc?.status === "approved" ? "background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7;" : "background:#fff8e1; color:#f57f17; border:1px solid #ffe082;"} }
  .meta-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:14px; }
  .meta-box { border:1px solid #d0d6e0; border-radius:5px; padding:7px 10px; background:#f7f9fc; }
  .meta-box .label { font-size:7pt; color:#888; text-transform:uppercase; letter-spacing:.5px; }
  .meta-box .value { font-size:12pt; font-weight:700; color:#1a237e; margin-top:2px; }
  .meta-box .value.mono { font-family:"Courier New",monospace; }
  .status { padding:8px 14px; border-radius:5px; font-size:9pt; font-weight:600; margin-bottom:14px; }
  .status.ok { background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7; }
  .status.shortage { background:#fce4ec; color:#c62828; border:1px solid #ef9a9a; }
  table { width:100%; border-collapse:collapse; font-size:9pt; }
  thead th { background:#1a237e; color:#fff; padding:8px 10px; text-align:left; font-size:8pt; text-transform:uppercase; letter-spacing:.5px; }
  thead th.num { text-align:right; }
  tbody tr { border-bottom:1px solid #e0e5ee; }
  tbody tr.even { background:#f7f9fc; }
  tbody td { padding:7px 10px; vertical-align:middle; }
  tbody td.num { text-align:right; font-family:"Courier New",monospace; }
  tbody td.bold { font-weight:700; }
  tbody td.shortage-cell { color:#c62828; font-weight:700; }
  tbody td.ok-cell { color:#2e7d32; }
  .sub { font-size:8pt; color:#666; }
  tfoot td { padding:8px 10px; font-weight:700; background:#e8eaf6; border-top:2px solid #1a237e; font-family:"Courier New",monospace; text-align:right; }
  tfoot td:first-child { text-align:left; font-family:Arial,sans-serif; text-transform:uppercase; font-size:8pt; letter-spacing:.5px; }
  .remark { min-width:80px; border-left:1px dashed #ccc !important; }
  .signatures { margin-top:28px; display:grid; grid-template-columns:repeat(3,1fr); gap:30px; }
  .sig-box { border-top:1px solid #333; padding-top:6px; }
  .sig-box .role { font-size:8pt; text-transform:uppercase; color:#888; letter-spacing:.5px; }
  .sig-box .date-line { margin-top:18px; border-top:1px solid #aaa; font-size:8pt; color:#aaa; padding-top:4px; }
  .footer { margin-top:20px; font-size:7pt; color:#aaa; text-align:center; border-top:1px solid #e0e5ee; padding-top:8px; }
</style></head><body>
<div class="header">
  <div class="logo-area"><h1>NEXUS ERP</h1><p>Manufacturing &amp; Inventory Management System</p></div>
  <div class="doc-title">
    <h2>Manufacturing Plan &amp; Material Pick List</h2>
    <div class="ref">
      <span class="doc-num">${docNumber}</span>
      <span class="status-badge">${statusLabel}</span>
    </div>
    <div class="ref" style="margin-top:4px">Generated: ${dateStr} at ${timeStr}</div>
  </div>
</div>
<div class="meta-grid">
  <div class="meta-box"><div class="label">Product Code</div><div class="value mono">${pr.productCode}</div></div>
  <div class="meta-box"><div class="label">Product Name</div><div class="value" style="font-size:10pt">${pr.productName || "—"}</div></div>
  <div class="meta-box"><div class="label">Target Quantity</div><div class="value mono">${pr.targetQty}</div></div>
  <div class="meta-box"><div class="label">Stock Location</div><div class="value" style="font-size:10pt">${locationLabel}</div></div>
</div>
${statusHtml}
<table>
  <thead><tr>
    <th style="width:30px">#</th><th>Material</th>
    <th class="num" style="width:80px">Per Unit</th>
    <th class="num" style="width:90px">Required Qty</th>
    <th class="num" style="width:90px">Available</th>
    <th class="num" style="width:80px">Shortage</th>
    <th style="width:110px">Remark / Batch</th>
  </tr></thead>
  <tbody>${rowsHtml}</tbody>
  <tfoot><tr>
    <td colspan="2">Total</td><td></td>
    <td>${pr.items.reduce((s: number, i: any) => s + i.requiredQty, 0).toLocaleString()}</td>
    <td>${pr.items.reduce((s: number, i: any) => s + i.availableQty, 0).toLocaleString()}</td>
    <td class="${hasShortages ? "shortage-cell" : "ok-cell"}">${pr.items.reduce((s: number, i: any) => s + i.shortageQty, 0).toLocaleString() || "—"}</td>
    <td></td>
  </tr></tfoot>
</table>
<div class="signatures">
  <div class="sig-box"><div class="role">Prepared by (Planner)</div><div style="margin-top:2px">&nbsp;</div><div class="date-line">Name &amp; Date</div></div>
  <div class="sig-box"><div class="role">Issued by (Storekeeper)</div><div style="margin-top:2px">&nbsp;</div><div class="date-line">Name &amp; Date</div></div>
  <div class="sig-box"><div class="role">Approved by (Manager)</div><div style="margin-top:2px">&nbsp;</div><div class="date-line">Name &amp; Date</div></div>
</div>
<div class="footer">Nexus ERP — ${docNumber} — ${pr.productCode} / Qty ${pr.targetQty} — Printed ${dateStr} ${timeStr}</div>
<script>window.onload = () => window.print();</script>
</body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page header */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
          <Factory className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Manufacturing Plan</h1>
          <p className="text-muted-foreground mt-1">BOM explosion, save drafts, and approve production plans.</p>
        </div>
      </div>

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full max-w-xs grid-cols-2 mb-6">
          <TabsTrigger value="new" className="gap-2"><Calculator className="h-4 w-4" /> New Plan</TabsTrigger>
          <TabsTrigger value="saved" className="gap-2"><ClipboardList className="h-4 w-4" /> Saved Plans</TabsTrigger>
        </TabsList>

        {/* ── New Plan Tab ── */}
        <TabsContent value="new">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: params */}
            <div className="lg:col-span-1">
              <div className="premium-card p-6">
                <h2 className="text-xl font-semibold mb-4 border-b border-border/50 pb-2">Plan Parameters</h2>
                <form onSubmit={handleCalculate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Product to Manufacture</Label>
                    <Select value={productCode} onValueChange={v => { setProductCode(v); setPlanResult(null); setSavedPlan(null); }} required>
                      <SelectTrigger className="bg-background"><SelectValue placeholder="Select product..." /></SelectTrigger>
                      <SelectContent>
                        {products?.map(p => (
                          <SelectItem key={p.id} value={p.productCode}>
                            {p.productCode}{p.productName ? ` - ${p.productName}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Quantity</Label>
                    <Input type="number" min="1" value={targetQty}
                      onChange={e => { setTargetQty(e.target.value); setPlanResult(null); setSavedPlan(null); }}
                      required className="bg-background" />
                  </div>

                  <div className="space-y-2">
                    <Label>Check Availability In</Label>
                    <Select value={locationId} onValueChange={val => {
                      setLocationId(val);
                      setLocationLabel(val === "all" ? "All Locations" : (locations?.find(l => l.id.toString() === val)?.locationName || val));
                      setPlanResult(null); setSavedPlan(null);
                    }}>
                      <SelectTrigger className="bg-background"><SelectValue placeholder="All Locations" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations (Global)</SelectItem>
                        {locations?.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.locationName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4" disabled={calcMutation.isPending}>
                    {calcMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                    Calculate Requirements
                  </Button>
                </form>
              </div>
            </div>

            {/* Right: result */}
            <div className="lg:col-span-2 space-y-4">
              {planResult ? (
                <>
                  {/* Doc number banner (after save) */}
                  {savedPlan && (
                    <div className={`flex items-center justify-between gap-3 rounded-xl border px-5 py-3 ${savedPlan.status === "approved" ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
                      <div className="flex items-center gap-3">
                        <FileText className={`h-5 w-5 ${savedPlan.status === "approved" ? "text-emerald-400" : "text-amber-400"}`} />
                        <div>
                          <div className="text-xs text-muted-foreground">Document Number</div>
                          <div className="font-mono font-bold text-lg text-foreground">{savedPlan.docNumber}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {savedPlan.status === "approved"
                          ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><ShieldCheck className="h-3.5 w-3.5" /> Approved</span>
                          : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30"><FileText className="h-3.5 w-3.5" /> Draft</span>
                        }
                      </div>
                    </div>
                  )}

                  <div className="premium-card overflow-hidden">
                    {/* Card header */}
                    <div className="bg-muted/30 p-6 border-b border-border">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">{planResult.productCode}</h3>
                          <p className="text-muted-foreground">{planResult.productName || "Product"}</p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Target Production</div>
                            <div className="text-3xl font-mono font-bold text-primary">{planResult.targetQty}</div>
                          </div>
                          {/* Action buttons */}
                          <div className="flex gap-2 flex-wrap justify-end">
                            {!savedPlan && (
                              <Button onClick={handleSave} disabled={isSaving} size="sm"
                                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/20">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Plan
                              </Button>
                            )}
                            {savedPlan && savedPlan.status === "draft" && (
                              <Button onClick={handleApprove} disabled={isApproving} size="sm"
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
                                {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                Approve Plan
                              </Button>
                            )}
                            <Button onClick={() => handlePrint(planResult, savedPlan)} variant="outline" size="sm"
                              className="gap-2 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10">
                              <Printer className="h-4 w-4" /> Print
                            </Button>
                          </div>
                        </div>
                      </div>

                      {hasShortages ? (
                        <div className="mt-4 flex items-center p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          <strong>Shortages detected.</strong>&nbsp;Cannot fulfill plan with current inventory.
                        </div>
                      ) : (
                        <div className="mt-4 flex items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <strong>Sufficient inventory.</strong>&nbsp;All materials available for production.
                        </div>
                      )}
                    </div>

                    {/* BOM table */}
                    <div className="p-0 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-background/50">
                            <TableHead>Material</TableHead>
                            <TableHead className="text-right">Per Unit</TableHead>
                            <TableHead className="text-right">Required</TableHead>
                            <TableHead className="text-right">Available</TableHead>
                            <TableHead className="text-right">Shortage</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {planResult.items.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <div className="font-medium text-primary">{item.materialCode}</div>
                                <div className="text-xs text-muted-foreground">{item.materialName}</div>
                              </TableCell>
                              <TableCell className="text-right font-mono">{item.qtyPerUnit}</TableCell>
                              <TableCell className="text-right font-mono font-medium">{item.requiredQty}</TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground">{item.availableQty}</TableCell>
                              <TableCell className="text-right font-mono">
                                {item.shortageQty > 0
                                  ? <span className="text-destructive font-bold">{item.shortageQty}</span>
                                  : <span className="text-emerald-500">—</span>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {savedPlan
                          ? savedPlan.status === "approved"
                            ? "Plan is approved and locked."
                            : "Plan saved as draft. Click Approve to confirm."
                          : "Click Save Plan to record this plan with a unique document number."
                        }
                      </span>
                      <Button onClick={() => handlePrint(planResult, savedPlan)} variant="ghost" size="sm" className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-foreground">
                        <Printer className="h-3.5 w-3.5" /> Print Pick List
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full min-h-[400px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground/50">
                  <Calculator className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-lg">Enter parameters and calculate to begin</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Saved Plans Tab ── */}
        <TabsContent value="saved">
          <div className="premium-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">All Saved Plans</h2>
              <span className="text-sm text-muted-foreground">{savedPlans?.length ?? 0} plans</span>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Document No.</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPlans ? (
                    <TableRow><TableCell colSpan={8} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                  ) : !savedPlans?.length ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>No saved plans yet. Generate and save a plan first.</p>
                      </TableCell>
                    </TableRow>
                  ) : savedPlans.map(plan => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-mono text-primary font-semibold">{plan.docNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium">{plan.productCode}</div>
                        {plan.productName && <div className="text-xs text-muted-foreground">{plan.productName}</div>}
                      </TableCell>
                      <TableCell className="text-right font-mono">{parseFloat(plan.targetQty).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{plan.locationLabel || "All"}</TableCell>
                      <TableCell><StatusBadge status={plan.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {plan.createdBy?.fullName || plan.createdBy?.username || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {format(new Date(plan.createdAt), "dd MMM yyyy HH:mm")}
                        </div>
                        {plan.approvedAt && (
                          <div className="text-emerald-400 mt-0.5">
                            ✓ {format(new Date(plan.approvedAt), "dd MMM yyyy HH:mm")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handlePrint({ productCode: plan.productCode, productName: plan.productName || "", targetQty: parseFloat(plan.targetQty), totalMaterials: (plan.items as any[]).length, items: plan.items as any }, plan)}
                            title="Print">
                            <Printer className="h-4 w-4" />
                          </Button>
                          {plan.status === "draft" && (
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(plan.id, plan.docNumber)}
                              title="Delete draft">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
