import { createContext } from "react";

// Kept apart from the provider so that file only exports a component, which is
// what React Fast Refresh requires.
export const AuthContext = createContext(null);
