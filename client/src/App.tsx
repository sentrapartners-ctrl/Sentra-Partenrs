import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import Home from "./pages/Home";
import Accounts from "./pages/Accounts";
import Trades from "./pages/Trades";
import Analytics from "./pages/Analytics";
import CopyTrading from "./pages/CopyTrading";
import Strategies from "./pages/Strategies";
import Calendar from "./pages/Calendar";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/accounts"} component={Accounts} />
      <Route path={"/trades"} component={Trades} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/copy-trading"} component={CopyTrading} />
      <Route path={"/strategies"} component={Strategies} />
      <Route path={"/calendar"} component={Calendar} />
      <Route path={"/alerts"} component={Alerts} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
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

