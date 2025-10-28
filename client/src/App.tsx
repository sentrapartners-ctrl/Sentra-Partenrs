import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import ManagerDashboard from "./pages/ManagerDashboard";
import Accounts from "./pages/Accounts";
import Trades from "./pages/Trades";
import Analytics from "./pages/Analytics";
import CopyTrading from "./pages/CopyTrading";
import Strategies from "./pages/Strategies";
import Calendar from "./pages/Calendar";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import Subscriptions from "./pages/Subscriptions";
import MarketplaceVPS from "./pages/MarketplaceVPS";
import MarketplaceEAs from "./pages/MarketplaceEAs";
import EALicenses from "./pages/EALicenses";
import ExpertAdvisors from "./pages/ExpertAdvisors";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import LandingPage from "./pages/LandingPage";
import { useAuth } from "./_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";


function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/start" component={LandingPage} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/">{() => <ProtectedRoute component={Home} />}</Route>
      <Route path="/admin">{() => <ProtectedRoute component={Admin} />}</Route>
      <Route path="/manager">{() => <ProtectedRoute component={ManagerDashboard} />}</Route>
      <Route path="/accounts">{() => <ProtectedRoute component={Accounts} />}</Route>
      <Route path="/trades">{() => <ProtectedRoute component={Trades} />}</Route>
      <Route path="/analytics">{() => <ProtectedRoute component={Analytics} />}</Route>
      <Route path="/copy-trading">{() => <ProtectedRoute component={CopyTrading} />}</Route>
      <Route path="/strategies">{() => <ProtectedRoute component={Strategies} />}</Route>
      <Route path="/calendar">{() => <ProtectedRoute component={Calendar} />}</Route>
      <Route path="/alerts">{() => <ProtectedRoute component={Alerts} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
      <Route path="/subscriptions">{() => <ProtectedRoute component={Subscriptions} />}</Route>
      <Route path="/marketplace/vps">{() => <ProtectedRoute component={MarketplaceVPS} />}</Route>
      <Route path="/marketplace/eas">{() => <ProtectedRoute component={MarketplaceEAs} />}</Route>
      <Route path="/ea-licenses">{() => <ProtectedRoute component={EALicenses} />}</Route>
      <Route path="/expert-advisors">{() => <ProtectedRoute component={ExpertAdvisors} />}</Route>
      <Route path="/checkout">{() => <ProtectedRoute component={Checkout} />}</Route>
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/checkout/cancel" component={CheckoutCancel} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <CurrencyProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

