import { createBrowserRouter } from "react-router";
import { LandingPage } from "./components/LandingPageFigma";
import { AuthPageWrapper } from "./components/AuthPageWrapper";
import App from "./App";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/auth",
    Component: AuthPageWrapper,
  },
  {
    path: "/dashboard",
    Component: App,
  },
]);
