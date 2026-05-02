import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import i18n, { isValidLang, RTL_LANGS, detectBrowserLang, type Lang } from "@/i18n";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Protocol from "@/pages/protocol";
import Safety from "@/pages/safety";
import Verify from "@/pages/verify";
import Registry from "@/pages/records";
import CreateRecord from "@/pages/create";
import RecordDetail from "@/pages/record-detail";
import HowItWorks from "@/pages/how-it-works";
import ForWitnesses from "@/pages/for-witnesses";
import ForJournalists from "@/pages/for-journalists";
import ForHumanRights from "@/pages/for-human-rights";
import OfflinePage from "@/pages/offline";
import SharePage from "@/pages/share";

const queryClient = new QueryClient();

function LanguageSync() {
  const [location] = useLocation();
  useEffect(() => {
    const seg = location.split("/")[1] ?? "";
    const lang: Lang = isValidLang(seg) ? seg : "en";
    if (i18n.language !== lang) i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
    localStorage.setItem("sw-lang", lang);
  }, [location]);
  return null;
}

function LangRedirect() {
  const stored = localStorage.getItem("sw-lang");
  const lang = stored && isValidLang(stored) ? stored : detectBrowserLang();
  return <Redirect to={`/${lang}`} />;
}

function Router() {
  return (
    <>
      <LanguageSync />
      <Switch>
        <Route path="/" component={LangRedirect} />
        {/* Legacy redirects */}
        <Route path="/create"><Redirect to="/en/create" /></Route>
        <Route path="/verify"><Redirect to="/en/verify" /></Route>
        <Route path="/records"><Redirect to="/en/records" /></Route>
        <Route path="/protocol"><Redirect to="/en/protocol" /></Route>
        <Route path="/safety"><Redirect to="/en/safety" /></Route>
        {/* Language-prefixed routes — specific first */}
        <Route path="/:lang/records/:packageHash" component={RecordDetail} />
        <Route path="/:lang/records" component={Registry} />
        <Route path="/:lang/create" component={CreateRecord} />
        <Route path="/:lang/verify" component={Verify} />
        <Route path="/:lang/protocol" component={Protocol} />
        <Route path="/:lang/safety" component={Safety} />
        <Route path="/:lang/how-it-works" component={HowItWorks} />
        <Route path="/:lang/for-witnesses" component={ForWitnesses} />
        <Route path="/:lang/for-journalists" component={ForJournalists} />
        <Route path="/:lang/for-human-rights" component={ForHumanRights} />
        <Route path="/:lang/offline" component={OfflinePage} />
        <Route path="/:lang/share" component={SharePage} />
        <Route path="/:lang" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
