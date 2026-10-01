import React from "react";
import { createRoot } from "react-dom/client";
import FavouritesPage from "./components/FavouritesPage";

const favouritesPage = document.getElementById("favourites-page");

if (favouritesPage) createRoot(favouritesPage).render(<FavouritesPage />);