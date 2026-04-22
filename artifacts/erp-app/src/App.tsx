import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import MaterialsPage from "@/pages/materials";
import ProductsPage from "@/pages/products";
import ProductBomPage from "@/pages/product-bom";
import LocationsPage from "@/pages/locations";
import StockInPage from "@/pages/inventory/stock-in";
import TransferPage from "@/pages/inventory/transfer";
import InventoryAuditPage from "@/pages/inventory/audit";
import ManufacturingPlanPage from "@/pages/manufacturing/plan";
import ProductionJobsPage from "@/pages/production/jobs";
import ReportsPage from "@/pages/reports";
import UsersPage from "@/pages/admin/users";

const queryClient = new QueryClient();

// Protected Route Wrapper
function ProtectedRoute({ component: Component, roles = [] }: { component: React.ComponentType, roles?: string[] }) {
  // Access control is checked inside the AppLayout context technically, 
  // but simpler to just wrap with AppLayout for all protected pages.
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Protected Routes wrapped in AppLayout */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/materials">
        <ProtectedRoute component={MaterialsPage} />
      </Route>
      <Route path="/products">
        <ProtectedRoute component={ProductsPage} />
      </Route>
      <Route path="/products/:id">
        <ProtectedRoute component={ProductBomPage} />
      </Route>
      <Route path="/locations">
        <ProtectedRoute component={LocationsPage} />
      </Route>
      <Route path="/inventory/stock-in">
        <ProtectedRoute component={StockInPage} />
      </Route>
      <Route path="/inventory/transfer">
        <ProtectedRoute component={TransferPage} />
      </Route>
      <Route path="/inventory/audit">
        <ProtectedRoute component={InventoryAuditPage} />
      </Route>
      <Route path="/manufacturing/plan">
        <ProtectedRoute component={ManufacturingPlanPage} />
      </Route>
      <Route path="/production/jobs">
        <ProtectedRoute component={ProductionJobsPage} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={ReportsPage} />
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute component={UsersPage} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
