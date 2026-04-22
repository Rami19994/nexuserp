import { useState, useRef, useCallback } from "react";
import { useListMaterials, useListLocations, useStockIn } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Workflow, Loader2, FileSpreadsheet, Upload, Download,
  AlertCircle, X, ChevronRight, Table2
} from "lucide-react";
import * as XLSX from "xlsx";

interface ImportRow {
  materialCode: string;
  materialName: string;
  quantity: number;
  unit?: string;
  _rowNum: number;
  _error?: string;
}

interface ImportResult {
  materialCode: string;
  materialName: string;
  quantity: number;
  status: "success" | "error";
  error?: string;
}

export default function StockInPage() {
  const { data: materials } = useListMaterials();
  const { data: locations } = useListLocations();
  const stockInMutation = useStockIn();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Manual form state
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [reference, setReference] = useState("");
  const [userNote, setUserNote] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Import state
  const [importLocationId, setImportLocationId] = useState<string>("");
  const [importReference, setImportReference] = useState("");
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMaterial = materials?.find(m => m.id.toString() === selectedMaterialId);

  // ── Manual submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    try {
      await stockInMutation.mutateAsync({
        data: {
          materialCode: selectedMaterial.materialCode,
          materialName: selectedMaterial.materialName,
          quantity: parseFloat(quantity),
          locationId: parseInt(locationId),
          unit: selectedMaterial.unit,
          reference: reference || null,
          userNote: userNote || null,
        },
      });
      setIsSuccess(true);
      toast({ title: "Stock In Successful", description: "Inventory has been updated." });
      setTimeout(() => {
        setIsSuccess(false);
        setQuantity("1");
        setReference("");
        setUserNote("");
      }, 2000);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || "Failed to stock in." });
    }
  };

  // ── Excel parsing ──────────────────────────────────────────────────────
  const parseExcel = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (raw.length === 0) {
          toast({ variant: "destructive", title: "Empty file", description: "The Excel file contains no data rows." });
          return;
        }

        // Normalize column names (case-insensitive, trim whitespace)
        const normalize = (s: string) => String(s).toLowerCase().replace(/[\s_\-]+/g, "");

        const rows: ImportRow[] = raw.map((row, idx) => {
          const keys = Object.keys(row);
          const find = (patterns: string[]) => {
            const key = keys.find(k => patterns.some(p => normalize(k).includes(p)));
            return key ? String(row[key]).trim() : "";
          };

          const materialCode = find(["materialcode", "matcode", "code", "sku", "itemcode"]);
          const materialName = find(["materialname", "matname", "name", "description", "item"]);
          const quantityStr  = find(["quantity", "qty", "amount"]);
          const unit         = find(["unit", "uom", "measure"]);
          const quantity     = parseFloat(quantityStr);

          const errors: string[] = [];
          if (!materialCode)       errors.push("Missing material code");
          if (!materialName)       errors.push("Missing material name");
          if (isNaN(quantity) || quantity <= 0) errors.push("Invalid quantity");

          return {
            materialCode,
            materialName,
            quantity: isNaN(quantity) ? 0 : quantity,
            unit: unit || undefined,
            _rowNum: idx + 2,
            _error: errors.length ? errors.join(", ") : undefined,
          };
        });

        setImportRows(rows);
        setImportResults(null);
        toast({ title: `${rows.length} rows parsed`, description: `${rows.filter(r => !r._error).length} valid, ${rows.filter(r => r._error).length} with errors.` });
      } catch (err) {
        toast({ variant: "destructive", title: "Parse error", description: "Could not read the file. Make sure it's a valid Excel (.xlsx/.xls) or CSV file." });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseExcel(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseExcel(file);
  };

  // ── Bulk import ─────────────────────────────────────────────────────────
  const handleBulkImport = async () => {
    if (!importLocationId) {
      toast({ variant: "destructive", title: "Location required", description: "Please select a destination location." });
      return;
    }
    const validRows = importRows.filter(r => !r._error);
    if (validRows.length === 0) {
      toast({ variant: "destructive", title: "No valid rows", description: "Fix errors before importing." });
      return;
    }

    setIsImporting(true);
    try {
      const resp = await fetch("/api/inventory/stock-in/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          locationId: parseInt(importLocationId),
          reference: importReference || null,
          items: validRows.map(r => ({
            materialCode: r.materialCode,
            materialName: r.materialName,
            quantity: r.quantity,
            unit: r.unit,
          })),
        }),
      });

      const data = await resp.json();
      setImportResults(data.results);
      queryClient.invalidateQueries();

      if (data.errorCount === 0) {
        toast({ title: `✅ Import complete`, description: `${data.successCount} materials added to inventory.` });
      } else {
        toast({
          variant: "destructive",
          title: `Import finished with errors`,
          description: `${data.successCount} succeeded, ${data.errorCount} failed.`,
        });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Import failed", description: "Server error during bulk import." });
    } finally {
      setIsImporting(false);
    }
  };

  // ── Download template ───────────────────────────────────────────────────
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["material_code", "material_name", "quantity", "unit"],
      ["MAT-001", "Steel Rod 10mm", 100, "pcs"],
      ["MAT-002", "Aluminum Sheet", 50, "sheets"],
      ["MAT-NEW", "New Material Example", 200, "kg"],
    ]);
    ws["!cols"] = [{ wch: 16 }, { wch: 28 }, { wch: 12 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Import");
    XLSX.writeFile(wb, "stock_import_template.xlsx");
  };

  const validCount   = importRows.filter(r => !r._error).length;
  const invalidCount = importRows.filter(r => r._error).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <div className="p-3 bg-primary/20 text-primary rounded-xl">
          <Workflow className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Stock In / Receive</h1>
          <p className="text-muted-foreground mt-1">Receive materials one-by-one or import in bulk from Excel.</p>
        </div>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="manual" className="gap-2">
            <Workflow className="h-4 w-4" /> Manual Entry
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Import from Excel
          </TabsTrigger>
        </TabsList>

        {/* ── Manual Tab ── */}
        <TabsContent value="manual">
          <div className="premium-card p-6 md:p-8">
            {isSuccess ? (
              <div className="h-64 flex flex-col items-center justify-center animate-in zoom-in duration-500">
                <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
                <h2 className="text-2xl font-bold text-foreground">Stock Received!</h2>
                <p className="text-muted-foreground mt-2">Inventory updated successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Material</Label>
                    <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId} required>
                      <SelectTrigger className="h-12 bg-background">
                        <SelectValue placeholder="Search and select material..." />
                      </SelectTrigger>
                      <SelectContent>
                        {materials?.map(m => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            <span className="font-mono text-primary mr-2">{m.materialCode}</span>
                            {m.materialName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Destination Location</Label>
                    <Select value={locationId} onValueChange={setLocationId} required>
                      <SelectTrigger className="h-12 bg-background">
                        <SelectValue placeholder="Select warehouse/location..." />
                      </SelectTrigger>
                      <SelectContent>
                        {locations?.map(l => (
                          <SelectItem key={l.id} value={l.id.toString()}>{l.locationName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity to Receive</Label>
                    <div className="relative">
                      <Input
                        type="number" min="0.001" step="0.001" required
                        value={quantity} onChange={e => setQuantity(e.target.value)}
                        className="h-12 bg-background pr-16 text-lg font-mono"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                        {selectedMaterial?.unit || "unit"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Reference / PO Number (Optional)</Label>
                    <Input value={reference} onChange={e => setReference(e.target.value)}
                      className="h-12 bg-background" placeholder="e.g. PO-2025-001" />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea value={userNote} onChange={e => setUserNote(e.target.value)}
                      className="bg-background min-h-[100px]" placeholder="Any additional details..." />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <Button type="submit" size="lg"
                    className="w-full md:w-auto min-w-[200px] shadow-lg shadow-primary/20 text-md"
                    disabled={stockInMutation.isPending || !selectedMaterialId || !locationId}>
                    {stockInMutation.isPending
                      ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      : <Workflow className="mr-2 h-5 w-5" />}
                    Confirm Receipt
                  </Button>
                </div>
              </form>
            )}
          </div>
        </TabsContent>

        {/* ── Import Tab ── */}
        <TabsContent value="import" className="space-y-6">

          {/* Step 1 – Upload */}
          <div className="premium-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">1</span>
                <h2 className="text-lg font-semibold text-foreground">Upload Excel or CSV File</h2>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 text-xs">
                <Download className="h-3.5 w-3.5" /> Download Template
              </Button>
            </div>

            {/* Required columns hint */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>Required columns:</span>
              {["material_code", "material_name", "quantity"].map(c => (
                <code key={c} className="px-1.5 py-0.5 rounded bg-muted font-mono">{c}</code>
              ))}
              <span className="text-muted-foreground/60">+ optional: <code className="font-mono">unit</code></span>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all
                ${isDragging ? "border-primary bg-primary/10 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-primary/5"}
              `}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
              <FileSpreadsheet className={`h-12 w-12 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-center">
                <p className="font-semibold text-foreground">
                  {isDragging ? "Drop file here" : "Drag & drop your file here"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse — supports .xlsx, .xls, .csv</p>
              </div>
              {importRows.length > 0 && (
                <Badge variant="secondary" className="gap-1 mt-1">
                  <Table2 className="h-3 w-3" /> {importRows.length} rows loaded
                </Badge>
              )}
            </div>
          </div>

          {/* Step 2 – Preview & validate */}
          {importRows.length > 0 && (
            <div className="premium-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">2</span>
                  <h2 className="text-lg font-semibold text-foreground">Preview & Validate</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {validCount} valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" /> {invalidCount} errors
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => { setImportRows([]); setImportResults(null); }}>
                    <X className="h-4 w-4" /> Clear
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium w-10">#</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Material Code</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Material Name</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium">Quantity</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Unit</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {importRows.map((row, i) => {
                      const result = importResults?.find(r => r.materialCode === row.materialCode);
                      return (
                        <tr key={i} className={`transition-colors ${row._error ? "bg-destructive/5" : "hover:bg-muted/30"}`}>
                          <td className="px-4 py-2.5 text-muted-foreground">{row._rowNum}</td>
                          <td className="px-4 py-2.5 font-mono text-primary">{row.materialCode || <span className="text-destructive italic">missing</span>}</td>
                          <td className="px-4 py-2.5">{row.materialName || <span className="text-destructive italic">missing</span>}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{row.quantity > 0 ? row.quantity.toLocaleString() : <span className="text-destructive italic">invalid</span>}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{row.unit || "—"}</td>
                          <td className="px-4 py-2.5">
                            {result ? (
                              result.status === "success"
                                ? <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs gap-1"><CheckCircle2 className="h-3 w-3" /> Imported</Badge>
                                : <Badge variant="destructive" className="text-xs gap-1"><AlertCircle className="h-3 w-3" /> {result.error}</Badge>
                            ) : row._error
                              ? <Badge variant="destructive" className="text-xs gap-1"><AlertCircle className="h-3 w-3" /> {row._error}</Badge>
                              : <Badge variant="secondary" className="text-xs">Ready</Badge>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3 – Configure & Import */}
          {importRows.length > 0 && (
            <div className="premium-card p-6 space-y-5">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">3</span>
                <h2 className="text-lg font-semibold text-foreground">Configure & Import</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Destination Location <span className="text-destructive">*</span></Label>
                  <Select value={importLocationId} onValueChange={setImportLocationId}>
                    <SelectTrigger className="h-12 bg-background">
                      <SelectValue placeholder="Select warehouse / location..." />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map(l => (
                        <SelectItem key={l.id} value={l.id.toString()}>{l.locationName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Reference / PO Number (Optional)</Label>
                  <Input value={importReference} onChange={e => setImportReference(e.target.value)}
                    className="h-12 bg-background" placeholder="e.g. PO-2025-010" />
                </div>
              </div>

              {/* Summary banner */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Table2 className="h-4 w-4" />
                  <span><strong className="text-foreground">{validCount}</strong> materials will be imported</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    <span><strong>{invalidCount}</strong> rows skipped (errors)</span>
                  </div>
                )}
                {importLocationId && locations && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                    <span>To: <strong className="text-foreground">{locations.find(l => l.id.toString() === importLocationId)?.locationName}</strong></span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={handleBulkImport}
                  disabled={isImporting || !importLocationId || validCount === 0 || !!importResults}
                  className="gap-2 min-w-[200px] shadow-lg shadow-primary/20"
                >
                  {isImporting
                    ? <><Loader2 className="h-5 w-5 animate-spin" /> Importing…</>
                    : <><Upload className="h-5 w-5" /> Import {validCount} Items</>
                  }
                </Button>
                {importResults && (
                  <Button variant="outline" size="lg" onClick={() => { setImportRows([]); setImportResults(null); setImportLocationId(""); setImportReference(""); }}
                    className="gap-2">
                    <FileSpreadsheet className="h-5 w-5" /> Import Another File
                  </Button>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
