import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import "./globals.css";
import AppMain from "./AppMain";
import AppSelectSurface from "./AppSelectSurface";
import AppSelectAudioDevice from "./AppSelectAudioDevice";
import AppError from "./AppError";
import { AppResult } from "./AppResult";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppMain />,
  },
  {
    path: "/select-surface",
    element: <AppSelectSurface />,
  },
  {
    path: "/select-audio-device",
    element: <AppSelectAudioDevice />,
  },
  {
    path: "/error",
    element: <AppError />,
  },
  {
    path: "/result",
    element: <AppResult />,
  }
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
