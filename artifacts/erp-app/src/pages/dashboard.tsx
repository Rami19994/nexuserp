import { useGetDashboardStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Box, MapPin, AlertTriangle, ArrowRightLeft, DollarSign, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // Placeholder data for charts to make it visually interesting
  const activityData = [
    { name: 'Mon', transactions: 12 },
    { name: 'Tue', transactions: 19 },
    { name: 'Wed', transactions: 15 },
    { name: 'Thu', transactions: 22 },
    { name: 'Fri', transactions: 30 },
    { name: 'Sat', transactions: 10 },
    { name: 'Sun', transactions: 5 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">System overview and key metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Materials" 
          value={stats?.totalMaterials.toString() || "0"} 
          icon={<Box className="h-6 w-6 text-primary" />} 
          trend="+4% from last month"
        />
        <StatCard 
          title="Total Products" 
          value={stats?.totalProducts.toString() || "0"} 
          icon={<Package className="h-6 w-6 text-accent" />} 
          trend="+12% from last month"
        />
        <StatCard 
          title="Active Locations" 
          value={stats?.totalLocations.toString() || "0"} 
          icon={<MapPin className="h-6 w-6 text-purple-500" />} 
          trend="No change"
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={stats?.lowStockItems.toString() || "0"} 
          icon={<AlertTriangle className={`h-6 w-6 ${(stats?.lowStockItems || 0) > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />} 
          trend="Requires attention"
          danger={(stats?.lowStockItems || 0) > 0}
        />
        <StatCard 
          title="Recent Transactions" 
          value={stats?.recentTransactions.toString() || "0"} 
          icon={<ArrowRightLeft className="h-6 w-6 text-blue-400" />} 
          trend="Last 7 days"
        />
        <StatCard 
          title="Est. Stock Value" 
          value={`$${(stats?.totalStockValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={<DollarSign className="h-6 w-6 text-emerald-500" />} 
          trend="Based on average cost"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Transaction Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                />
                <Bar dataKey="transactions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Activity className="mr-2 h-5 w-5 text-accent" />
              Material Consumption Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                />
                <Line type="monotone" dataKey="transactions" stroke="hsl(var(--accent))" strokeWidth={3} dot={{r: 4, fill: 'hsl(var(--background))', strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, danger = false }: { title: string, value: string, icon: React.ReactNode, trend: string, danger?: boolean }) {
  return (
    <Card className={`premium-card overflow-hidden relative ${danger ? 'ring-1 ring-destructive/50' : ''}`}>
      {danger && <div className="absolute top-0 right-0 w-16 h-16 bg-destructive/10 rounded-bl-full blur-xl" />}
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="p-3 bg-muted/50 rounded-xl border border-white/5 shadow-inner">
            {icon}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className={`text-3xl font-display font-bold mt-1 ${danger ? 'text-destructive' : 'text-foreground'}`}>
              {value}
            </h3>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
}
